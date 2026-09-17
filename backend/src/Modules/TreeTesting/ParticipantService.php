<?php

declare(strict_types=1);

namespace Soraq\Modules\TreeTesting;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Validation\Payload;
use Soraq\Core\Validation\Validator;
use Soraq\Modules\Studies\StudyFlow;

/**
 * Public, anonymous participation in a tree test through the shared link (/treetesting/{slug}/{code}).
 *
 * Same rules as Card Sorting: only published studies are reachable, a random token (stored hashed)
 * authorises the session, screening is evaluated on the server, and submissions are validated against the
 * snapshot taken at start. Nothing identifying is stored with the response.
 */
final class ParticipantService
{
    private const MAX_EVENTS_PER_TASK = 300;
    private const MAX_TASK_SECONDS = 7200;

    /**
     * @param array{0: int, 1: int} $startLimit
     * @param array{0: int, 1: int} $submitLimit
     */
    public function __construct(
        private readonly TreeTestRepository $studies,
        private readonly RateLimiter $rateLimiter,
        private readonly array $startLimit,
        private readonly array $submitLimit,
    ) {
    }

    /** @return array<string, mixed> */
    public function landing(string $code): array
    {
        $study = $this->findByCode($code);
        $flow = $study['content']['flow'] ?? [];

        return [
            'status' => $study['status'],
            'welcome' => $study['status'] === TreeTest::STATUS_ACTIVE ? ($flow['welcome'] ?? null) : null,
            'closed' => $study['status'] === TreeTest::STATUS_CLOSED ? ($flow['closed'] ?? null) : null,
            'settings' => $this->publicSettings($study['settings']),
        ];
    }

    /** @return array<string, mixed> */
    public function start(string $code, Request $request): array
    {
        $this->rateLimiter->hit('tree_test:start:ip:' . $request->ip, $this->startLimit);
        $study = $this->findByCode($code);
        if ($study['status'] !== TreeTest::STATUS_ACTIVE) {
            throw new HttpException(409, 'study_unavailable', 'errors.tree_test_unavailable');
        }

        $token = bin2hex(random_bytes(32));
        $this->studies->startResponse($study['id'], hash('sha256', $token), TreeTestContent::snapshot($study['content']));

        return ['token' => $token] + TreeTestContent::participantView($study['content'], $this->publicSettings($study['settings']));
    }

    /**
     * @param array<string, mixed> $input {token, answers}
     * @return array<string, mixed>
     */
    public function screening(string $code, array $input, Request $request): array
    {
        [$study, $response] = $this->session($code, $input, $request);
        $result = StudyFlow::evaluateScreening($response['snapshot']['screeningQuestions'] ?? [], is_array($input['answers'] ?? null) ? $input['answers'] : [], new Payload());
        $this->studies->saveScreening($response['id'], $result['answers'], $result['passed']);

        if ($result['passed']) {
            return ['result' => 'continue'];
        }
        $this->studies->finishResponse($study['id'], $response['id'], 'screened_out', null, null);

        return ['result' => 'screened_out', 'rejection' => $study['content']['flow']['screening']['rejection'] ?? null];
    }

    /**
     * @param array<string, mixed> $input {token, tasks: [{taskId, events, nominatedNodeId, skipped, durationSeconds}], postAnswers}
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
        $tasks = $this->taskResults($input['tasks'] ?? null, $snapshot, $p);
        $postAnswers = StudyFlow::normalizeAnswers($p->object($input['postAnswers'] ?? null, 'postAnswers'), $snapshot['postQuestions'] ?? [], $p);
        $p->throwIfInvalid();

        $this->studies->finishResponse($study['id'], $response['id'], 'completed', $postAnswers, $tasks);

        return ['result' => 'completed'];
    }

    /**
     * One result per task of the snapshot: the clicks in order, the answer and whether it was skipped.
     *
     * @param array<string, mixed> $snapshot
     * @return list<array<string, mixed>>
     */
    private function taskResults(mixed $input, array $snapshot, Payload $p): array
    {
        $nodeIds = TreeTestContent::nodeIds($snapshot['tree'] ?? []);
        $taskIds = array_column($snapshot['tasks'] ?? [], 'id');
        $seen = [];
        $out = [];

        foreach ($p->objects($input, 'tasks', count($taskIds) + 1) as $i => $task) {
            $taskId = $task['taskId'] ?? null;
            if (!is_string($taskId) || !in_array($taskId, $taskIds, true) || isset($seen[$taskId])) {
                $p->fail("tasks.$i.taskId", 'validation.invalid');
                continue;
            }
            $seen[$taskId] = true;

            $events = [];
            foreach ($p->objects($task['events'] ?? [], "tasks.$i.events", self::MAX_EVENTS_PER_TASK) as $j => $event) {
                $action = $p->enum($event['action'] ?? null, "tasks.$i.events.$j.action", ['enter', 'back'], 'enter');
                $nodeId = $event['nodeId'] ?? null;
                if (!is_string($nodeId) || !in_array($nodeId, $nodeIds, true)) {
                    $p->fail("tasks.$i.events.$j.nodeId", 'validation.invalid');
                    continue;
                }
                $events[] = ['nodeId' => $nodeId, 'action' => $action];
            }

            $nominated = $task['nominatedNodeId'] ?? null;
            if ($nominated !== null && (!is_string($nominated) || !in_array($nominated, $nodeIds, true))) {
                $p->fail("tasks.$i.nominatedNodeId", 'validation.invalid');
                $nominated = null;
            }

            $out[] = [
                'taskId' => $taskId,
                'events' => $events,
                'nominatedNodeId' => $nominated,
                'skipped' => $p->bool($task['skipped'] ?? false) || $nominated === null,
                'durationSeconds' => $p->int($task['durationSeconds'] ?? null, "tasks.$i.durationSeconds", 0, self::MAX_TASK_SECONDS, 0),
            ];
        }

        if (count($out) !== count($taskIds)) {
            $p->fail('tasks', 'errors.tree_test_missing_tasks');
        }

        return $out;
    }

    /** @return array{0: array<string, mixed>, 1: array<string, mixed>} */
    private function session(string $code, array $input, Request $request): array
    {
        $this->rateLimiter->hit('tree_test:submit:ip:' . $request->ip, $this->submitLimit);
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
