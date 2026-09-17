<?php

declare(strict_types=1);

namespace Soraq\Modules\CardSorting;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Validation\Payload;
use Soraq\Core\Validation\Validator;

/**
 * Public, anonymous participation through the shared link (/cardsorting/{slug}/{code}).
 *
 * - Only published studies are reachable; drafts are indistinguishable from unknown codes (404).
 * - Starting returns a random token (only its sha256 is stored) that authorises the rest of the session.
 * - Screening rules are evaluated here, never in the browser.
 * - Submissions are validated against the snapshot taken at start.
 * - Nothing identifying (IP, user agent) is stored with responses; IPs are only used transiently for rate limits.
 */
final class ParticipantService
{
    private const TEXT_ANSWER_MAX = 2000;

    /**
     * @param array{0: int, 1: int} $startLimit
     * @param array{0: int, 1: int} $submitLimit
     */
    public function __construct(
        private readonly CardSortRepository $studies,
        private readonly RateLimiter $rateLimiter,
        private readonly array $startLimit,
        private readonly array $submitLimit,
    ) {
    }

    /** @return array<string, mixed> landing data: status, welcome/closed messages and look & feel */
    public function landing(string $code): array
    {
        $study = $this->findByCode($code);
        $flow = $study['content']['flow'] ?? [];

        return [
            'status' => $study['status'],
            'welcome' => $study['status'] === CardSort::STATUS_ACTIVE ? ($flow['welcome'] ?? null) : null,
            'closed' => $study['status'] === CardSort::STATUS_CLOSED ? ($flow['closed'] ?? null) : null,
            'settings' => $this->publicSettings($study['settings']),
        ];
    }

    /** @return array<string, mixed> */
    public function start(string $code, Request $request): array
    {
        $this->rateLimiter->hit('card_sort:start:ip:' . $request->ip, $this->startLimit);
        $study = $this->findByCode($code);
        if ($study['status'] !== CardSort::STATUS_ACTIVE) {
            throw new HttpException(409, 'study_unavailable', 'errors.card_sort_unavailable');
        }

        $token = bin2hex(random_bytes(32));
        $this->studies->startResponse($study['id'], hash('sha256', $token), CardSortContent::snapshot($study['sortType'], $study['content']));

        $view = CardSortContent::participantView($study['sortType'], $study['content'], $this->publicSettings($study['settings']));

        return ['token' => $token] + $view;
    }

    /**
     * @param array<string, mixed> $input {token, answers: {questionId: optionId}}
     * @return array<string, mixed> {result: continue} or {result: screened_out, rejection}
     */
    public function screening(string $code, array $input, Request $request): array
    {
        [$study, $response] = $this->session($code, $input, $request);
        $questions = $response['snapshot']['screeningQuestions'] ?? [];
        $answers = is_array($input['answers'] ?? null) ? $input['answers'] : [];

        $clean = [];
        $passed = true;
        foreach ($questions as $question) {
            $optionId = $answers[$question['id']] ?? null;
            $option = null;
            foreach ($question['options'] as $candidate) {
                if ($candidate['id'] === $optionId) {
                    $option = $candidate;
                }
            }
            if ($option === null) {
                throw HttpException::validation(['answers.' . $question['id'] => ['validation.required']]);
            }
            $clean[$question['id']] = $option['id'];
            $passed = $passed && $option['qualifies'];
        }

        $this->studies->saveScreening($response['id'], $clean, $passed);

        if ($passed) {
            return ['result' => 'continue'];
        }

        $this->studies->finishResponse($study['id'], $response['id'], 'screened_out', null, null);

        return ['result' => 'screened_out', 'rejection' => $study['content']['flow']['screening']['rejection'] ?? null];
    }

    /**
     * @param array<string, mixed> $input {token, categories: [{label, predefinedId?, cardIds}], postAnswers: {questionId: value}}
     * @return array<string, mixed>
     */
    public function complete(string $code, array $input, Request $request): array
    {
        [$study, $response] = $this->session($code, $input, $request);
        $snapshot = $response['snapshot'];

        if (($snapshot['screeningQuestions'] ?? []) !== [] && !$response['screeningPassed']) {
            throw new HttpException(409, 'screening_required', 'errors.card_sort_screening_required');
        }

        $p = new Payload();
        $categories = $this->categories($input['categories'] ?? null, $snapshot, $p);
        $postAnswers = $this->postAnswers($p->object($input['postAnswers'] ?? null, 'postAnswers'), $snapshot['postQuestions'] ?? [], $p);
        $p->throwIfInvalid();

        $this->studies->finishResponse($study['id'], $response['id'], 'completed', $postAnswers, $categories);

        return ['result' => 'completed'];
    }

    /** @return array{0: array<string, mixed>, 1: array<string, mixed>} */
    private function session(string $code, array $input, Request $request): array
    {
        $this->rateLimiter->hit('card_sort:submit:ip:' . $request->ip, $this->submitLimit);
        $study = $this->findByCode($code);
        $data = Validator::validate($input, ['token' => ['required', 'string', 'max:64']]);

        $response = preg_match('/^[a-f0-9]{64}$/', $data['token']) ? $this->studies->findResponse($study['id'], hash('sha256', $data['token'])) : null;
        if ($response === null) {
            throw HttpException::notFound('errors.card_sort_session_not_found');
        }
        if ($response['status'] !== 'in_progress') {
            throw new HttpException(409, 'already_finished', 'errors.card_sort_already_finished');
        }

        return [$study, $response];
    }

    /** @return array<string, mixed> */
    private function findByCode(string $code): array
    {
        $study = preg_match('/^[a-z0-9]{6,16}$/', $code) ? $this->studies->findByShareCode($code) : null;

        return $study ?? throw HttpException::notFound('errors.card_sort_link_not_found');
    }

    /**
     * Every card must be placed exactly once; closed sorts only accept predefined categories.
     *
     * @param array<string, mixed> $snapshot
     * @return list<array{label: string, predefinedId: ?string, cardIds: list<string>}>
     */
    private function categories(mixed $input, array $snapshot, Payload $p): array
    {
        $cardIds = array_column($snapshot['cards'] ?? [], 'id');
        $predefined = array_column($snapshot['categories'] ?? [], 'label', 'id');
        $sortType = $snapshot['sortType'] ?? 'open';

        $placed = [];
        $out = [];
        foreach ($p->objects($input, 'categories', CardSortContent::MAX_CATEGORIES + 50) as $i => $category) {
            $predefinedId = $category['predefinedId'] ?? null;
            if ($predefinedId !== null && (!is_string($predefinedId) || !isset($predefined[$predefinedId]) || $sortType === 'open')) {
                $p->fail("categories.$i.predefinedId", 'validation.invalid');
                continue;
            }
            if ($sortType === 'closed' && $predefinedId === null) {
                $p->fail("categories.$i", 'validation.invalid');
                continue;
            }

            $ids = [];
            foreach (is_array($category['cardIds'] ?? null) ? $category['cardIds'] : [] as $cardId) {
                if (!is_string($cardId) || !in_array($cardId, $cardIds, true) || isset($placed[$cardId])) {
                    $p->fail("categories.$i.cardIds", 'validation.invalid');
                    continue;
                }
                $placed[$cardId] = true;
                $ids[] = $cardId;
            }
            if ($ids === []) {
                continue; // empty groups carry no information
            }

            $out[] = [
                'label' => $predefinedId !== null ? (string) $predefined[$predefinedId] : $p->string($category['label'] ?? null, "categories.$i.label", CardSortContent::CATEGORY_LABEL_MAX),
                'predefinedId' => $predefinedId,
                'cardIds' => $ids,
            ];
        }

        if (count($placed) !== count($cardIds)) {
            $p->fail('categories', 'errors.card_sort_unsorted_cards');
        }

        return $out;
    }

    /**
     * @param array<string, mixed>       $answers
     * @param list<array<string, mixed>> $questions
     * @return array<string, mixed>
     */
    private function postAnswers(array $answers, array $questions, Payload $p): array
    {
        $out = [];
        foreach ($questions as $q) {
            $value = $answers[$q['id']] ?? null;
            $field = 'postAnswers.' . $q['id'];
            $empty = $value === null || $value === '' || $value === [];

            if ($empty) {
                if ($q['required']) {
                    $p->fail($field, 'validation.required');
                }
                continue;
            }

            $optionIds = array_column($q['options'] ?? [], 'id');
            $valid = match ($q['type']) {
                'stars', 'scale' => is_int($value) && $value >= 1 && $value <= (int) $q['scaleMax'],
                'text' => is_string($value) && mb_strlen($value) <= self::TEXT_ANSWER_MAX,
                'radio' => is_string($value) && in_array($value, $optionIds, true),
                'checkbox' => is_array($value) && array_is_list($value) && count($value) <= count($optionIds)
                    && array_diff($value, $optionIds) === [] && count(array_unique($value)) === count($value),
                default => false,
            };
            if (!$valid) {
                $p->fail($field, 'validation.invalid');
                continue;
            }
            $out[$q['id']] = is_string($value) ? trim($value) : $value;
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string, mixed>
     */
    private function publicSettings(array $settings): array
    {
        return [
            'continueLabel' => $settings['continueLabel'] ?? '',
            'finishLabel' => $settings['finishLabel'] ?? '',
            'accentColor' => $settings['accentColor'] ?? null,
            'socialLinks' => ($settings['socialLinks'] ?? []) === [] ? new \stdClass() : $settings['socialLinks'],
        ];
    }
}
