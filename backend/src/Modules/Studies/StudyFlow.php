<?php

declare(strict_types=1);

namespace Soraq\Modules\Studies;

use Soraq\Core\I18n\Translator;
use Soraq\Core\Validation\Payload;
use Soraq\Core\Validation\RichText;

/**
 * Pieces every study with participants shares (docs/decisions/0016): the flow the participant goes through
 * (welcome → context → screening → instructions → activity → post-study → thanks, plus the closed message)
 * and the look & feel settings (button labels, accent colour, social links).
 *
 * Card Sorting and Tree Testing only add their own activity content (cards / tree and tasks).
 * This module has no routes: it is a library used by study modules.
 */
final class StudyFlow
{
    public const QUESTION_TYPES = ['stars', 'scale', 'text', 'radio', 'checkbox'];
    public const SOCIAL_NETWORKS = ['instagram', 'tiktok', 'youtube', 'linkedin', 'github', 'reddit', 'facebook', 'x', 'threads', 'discord', 'pinterest', 'whatsapp', 'twitch', 'kick'];

    public const MAX_QUESTIONS = 20;
    public const MAX_OPTIONS = 10;
    public const MAX_STEPS = 10;
    public const LABEL_MAX = 120;
    public const TITLE_MAX = 160;
    public const PLACEHOLDER_MAX = 120;

    /**
     * Default flow texts, read from lang/<locale>/<namespace>.php.
     *
     * @param list<array{0: string, 1: list<string>}> $instructions title key + list item keys ("intro" is the first line)
     * @return array<string, mixed>
     */
    public static function defaultFlow(Translator $t, string $ns, array $instructions): array
    {
        $text = static fn (string $key): string => $t->get("$ns.$key");
        $doc = static fn (string $key): array => RichText::paragraph($text($key));
        $item = static fn (string $key): array => ['type' => 'listItem', 'content' => [['type' => 'paragraph', 'content' => RichText::inline($text($key))]]];

        $steps = [];
        foreach ($instructions as [$titleKey, $lineKeys]) {
            $content = [['type' => 'paragraph', 'content' => RichText::inline($text($lineKeys[0]))]];
            $items = array_map($item, array_slice($lineKeys, 1));
            if ($items !== []) {
                $content[] = ['type' => 'bulletList', 'content' => $items];
            }
            $steps[] = ['id' => bin2hex(random_bytes(6)), 'title' => $text($titleKey), 'body' => ['type' => 'doc', 'content' => $content]];
        }

        return [
            'welcome' => ['title' => $text('welcome_title'), 'body' => $doc('welcome_body')],
            'context' => ['enabled' => false, 'title' => $text('context_title'), 'body' => $doc('context_body')],
            'screening' => [
                'enabled' => false,
                'questions' => [],
                'rejection' => ['title' => $text('rejection_title'), 'body' => $doc('rejection_body')],
            ],
            'instructions' => $steps,
            'postStudy' => ['enabled' => false, 'questions' => []],
            'thanks' => ['title' => $text('thanks_title'), 'body' => $doc('thanks_body')],
            'closed' => ['title' => $text('closed_title'), 'body' => $doc('closed_body')],
        ];
    }

    /** @return array<string, mixed> */
    public static function defaultSettings(Translator $t, string $ns): array
    {
        return [
            'continueLabel' => $t->get("$ns.continue_label"),
            'finishLabel' => $t->get("$ns.finish_label"),
            'accentColor' => null,
            'socialLinks' => new \stdClass(),
        ];
    }

    /**
     * @param array<string, mixed> $flow
     * @return array<string, mixed>
     */
    public static function normalizeFlow(array $flow, Payload $p): array
    {
        return [
            'welcome' => self::message($flow['welcome'] ?? null, $p, 'flow.welcome'),
            'context' => ['enabled' => $p->bool($flow['context']['enabled'] ?? false)] + self::message($flow['context'] ?? null, $p, 'flow.context'),
            'screening' => self::screening($p->object($flow['screening'] ?? null, 'flow.screening'), $p),
            'instructions' => self::instructions($flow['instructions'] ?? null, $p),
            'postStudy' => self::postStudy($p->object($flow['postStudy'] ?? null, 'flow.postStudy'), $p),
            'thanks' => self::message($flow['thanks'] ?? null, $p, 'flow.thanks'),
            'closed' => self::message($flow['closed'] ?? null, $p, 'flow.closed'),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public static function normalizeSettings(array $input, Payload $p): array
    {
        $accent = $input['accentColor'] ?? null;
        if ($accent !== null && (!is_string($accent) || !preg_match('/^#[0-9a-fA-F]{6}$/', $accent))) {
            $p->fail('settings.accentColor', 'validation.invalid');
            $accent = null;
        }

        $links = [];
        foreach ($p->object($input['socialLinks'] ?? null, 'settings.socialLinks') as $network => $url) {
            if (!in_array($network, self::SOCIAL_NETWORKS, true) || $url === null || $url === '') {
                continue;
            }
            $url = $p->string($url, "settings.socialLinks.$network", 300);
            if (filter_var($url, FILTER_VALIDATE_URL) === false || strtolower((string) parse_url($url, PHP_URL_SCHEME)) !== 'https') {
                $p->fail("settings.socialLinks.$network", 'validation.url');
                continue;
            }
            $links[$network] = $url;
        }

        return [
            'continueLabel' => $p->string($input['continueLabel'] ?? null, 'settings.continueLabel', 40),
            'finishLabel' => $p->string($input['finishLabel'] ?? null, 'settings.finishLabel', 40),
            'accentColor' => $accent === null ? null : strtolower($accent),
            'socialLinks' => $links === [] ? new \stdClass() : $links,
        ];
    }

    /**
     * What the participant receives: screening rules (which option qualifies) stay on the server.
     *
     * @param array<string, mixed> $flow
     * @return array<string, mixed>
     */
    public static function participantFlow(array $flow): array
    {
        return [
            'welcome' => $flow['welcome'],
            'context' => $flow['context']['enabled'] ? $flow['context'] : null,
            'screening' => $flow['screening']['enabled'] ? array_map(static fn (array $q): array => [
                'id' => $q['id'],
                'prompt' => $q['prompt'],
                'options' => array_map(static fn (array $o): array => ['id' => $o['id'], 'label' => $o['label']], $q['options']),
            ], $flow['screening']['questions']) : [],
            'instructions' => $flow['instructions'],
            'postStudy' => $flow['postStudy']['enabled'] ? $flow['postStudy']['questions'] : [],
            'thanks' => $flow['thanks'],
        ];
    }

    /**
     * Questions frozen with each response, so later edits never change past results.
     *
     * @param array<string, mixed> $flow
     * @return array{screeningQuestions: list<array<string, mixed>>, postQuestions: list<array<string, mixed>>}
     */
    public static function snapshotQuestions(array $flow): array
    {
        return [
            'screeningQuestions' => $flow['screening']['enabled'] ? $flow['screening']['questions'] : [],
            'postQuestions' => $flow['postStudy']['enabled'] ? $flow['postStudy']['questions'] : [],
        ];
    }

    /** @return array{title: string, body: array<string, mixed>} */
    public static function message(mixed $input, Payload $p, string $field): array
    {
        $input = $p->object($input, $field);

        return [
            'title' => $p->string($input['title'] ?? null, "$field.title", self::TITLE_MAX),
            'body' => RichText::normalize($input['body'] ?? null, $p, "$field.body"),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private static function screening(array $input, Payload $p): array
    {
        $questions = [];
        foreach ($p->objects($input['questions'] ?? [], 'flow.screening.questions', self::MAX_QUESTIONS) as $i => $q) {
            $field = "flow.screening.questions.$i";
            $options = [];
            foreach ($p->objects($q['options'] ?? [], "$field.options", self::MAX_OPTIONS) as $j => $o) {
                $options[] = [
                    'id' => $p->id($o['id'] ?? null, "$field.options.$j.id"),
                    'label' => $p->string($o['label'] ?? null, "$field.options.$j.label", self::LABEL_MAX),
                    'qualifies' => $p->bool($o['qualifies'] ?? false),
                ];
            }
            $p->uniqueIds($options, "$field.options");
            if (count($options) < 2) {
                $p->fail("$field.options", 'errors.card_sort_min_options');
            } elseif (!in_array(true, array_column($options, 'qualifies'), true)) {
                $p->fail("$field.options", 'errors.card_sort_no_qualifying_option');
            }
            $questions[] = [
                'id' => $p->id($q['id'] ?? null, "$field.id"),
                'prompt' => $p->string($q['prompt'] ?? null, "$field.prompt", self::TITLE_MAX),
                'options' => $options,
            ];
        }
        $p->uniqueIds($questions, 'flow.screening.questions');

        return [
            'enabled' => $p->bool($input['enabled'] ?? false),
            'questions' => $questions,
            'rejection' => self::message($input['rejection'] ?? null, $p, 'flow.screening.rejection'),
        ];
    }

    /** @return list<array<string, mixed>> */
    private static function instructions(mixed $input, Payload $p): array
    {
        $steps = [];
        foreach ($p->objects($input, 'flow.instructions', self::MAX_STEPS) as $i => $step) {
            $steps[] = ['id' => $p->id($step['id'] ?? null, "flow.instructions.$i.id")] + self::message($step, $p, "flow.instructions.$i");
        }
        $p->uniqueIds($steps, 'flow.instructions');

        return $steps;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    private static function postStudy(array $input, Payload $p): array
    {
        $questions = [];
        foreach ($p->objects($input['questions'] ?? [], 'flow.postStudy.questions', self::MAX_QUESTIONS) as $i => $q) {
            $field = "flow.postStudy.questions.$i";
            $type = $p->enum($q['type'] ?? null, "$field.type", self::QUESTION_TYPES, 'text');
            $question = [
                'id' => $p->id($q['id'] ?? null, "$field.id"),
                'type' => $type,
                'prompt' => $p->string($q['prompt'] ?? null, "$field.prompt", self::TITLE_MAX),
                'required' => $p->bool($q['required'] ?? false),
                'options' => [],
                'scaleMax' => null,
                'placeholder' => null,
            ];
            if ($type === 'radio' || $type === 'checkbox') {
                foreach ($p->objects($q['options'] ?? [], "$field.options", self::MAX_OPTIONS) as $j => $o) {
                    $question['options'][] = [
                        'id' => $p->id($o['id'] ?? null, "$field.options.$j.id"),
                        'label' => $p->string($o['label'] ?? null, "$field.options.$j.label", self::LABEL_MAX),
                    ];
                }
                $p->uniqueIds($question['options'], "$field.options");
                if (count($question['options']) < 2) {
                    $p->fail("$field.options", 'errors.card_sort_min_options');
                }
            } elseif ($type === 'text') {
                $placeholder = $p->string($q['placeholder'] ?? null, "$field.placeholder", self::PLACEHOLDER_MAX, false);
                $question['placeholder'] = $placeholder === '' ? null : $placeholder;
            } elseif ($type === 'stars' || $type === 'scale') {
                $question['scaleMax'] = $p->int($q['scaleMax'] ?? null, "$field.scaleMax", $type === 'stars' ? 3 : 2, 10, 5);
            }
            $questions[] = $question;
        }
        $p->uniqueIds($questions, 'flow.postStudy.questions');

        return ['enabled' => $p->bool($input['enabled'] ?? false), 'questions' => $questions];
    }

    /**
     * Validates the answers to the post-study questions against the snapshot.
     *
     * @param array<string, mixed>       $answers
     * @param list<array<string, mixed>> $questions
     * @return array<string, mixed>
     */
    public static function normalizeAnswers(array $answers, array $questions, Payload $p, int $textMax = 2000): array
    {
        $out = [];
        foreach ($questions as $q) {
            $value = $answers[$q['id']] ?? null;
            $field = 'postAnswers.' . $q['id'];
            if ($value === null || $value === '' || $value === []) {
                if ($q['required']) {
                    $p->fail($field, 'validation.required');
                }
                continue;
            }

            $optionIds = array_column($q['options'] ?? [], 'id');
            $valid = match ($q['type']) {
                'stars', 'scale' => is_int($value) && $value >= 1 && $value <= (int) $q['scaleMax'],
                'text' => is_string($value) && mb_strlen($value) <= $textMax,
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
     * Screening evaluation shared by every study: all questions answered; an option that does not
     * qualify ends the participation.
     *
     * @param list<array<string, mixed>> $questions
     * @param array<string, mixed>       $answers
     * @return array{answers: array<string, string>, passed: bool}
     */
    public static function evaluateScreening(array $questions, array $answers, Payload $p): array
    {
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
                $p->fail('answers.' . $question['id'], 'validation.required');
                continue;
            }
            $clean[$question['id']] = $option['id'];
            $passed = $passed && $option['qualifies'];
        }
        $p->throwIfInvalid();

        return ['answers' => $clean, 'passed' => $passed];
    }
}
