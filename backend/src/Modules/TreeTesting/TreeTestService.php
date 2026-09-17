<?php

declare(strict_types=1);

namespace Soraq\Modules\TreeTesting;

use Soraq\Core\Audit\AuditLogger;
use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\I18n\Translator;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Support\Ulid;
use Soraq\Core\Validation\Payload;
use Soraq\Core\Validation\Validator;
use Soraq\Modules\Projects\ProjectPolicy;
use Soraq\Modules\Projects\ProjectService;
use Soraq\Modules\Users\User;
use Soraq\Modules\Users\UserRepository;

/**
 * Designer-side operations on Tree Testing studies.
 *
 * | Action                                   | owner | editor | viewer | shared_viewer |
 * |------------------------------------------|:-----:|:------:|:------:|:-------------:|
 * | view study + report                      |   ✔   |   ✔    |   ✔    |       ✔       |
 * | create, edit, publish/pause/close        |   ✔   |   ✔    |        |               |
 * | delete results / delete study            |   ✔   |   ✔    |        |               |
 * | share read-only with other designers     |   ✔   |   ✔    |        |               |
 *
 * No access ⇒ 404 (same as missing or malformed id). Access without permission ⇒ 403.
 */
final class TreeTestService
{
    private const STATUS_TRANSITIONS = [
        'publish' => [[TreeTest::STATUS_DRAFT], TreeTest::STATUS_ACTIVE],
        'pause' => [[TreeTest::STATUS_ACTIVE], TreeTest::STATUS_PAUSED],
        'resume' => [[TreeTest::STATUS_PAUSED], TreeTest::STATUS_ACTIVE],
        'close' => [[TreeTest::STATUS_ACTIVE, TreeTest::STATUS_PAUSED], TreeTest::STATUS_CLOSED],
    ];

    /**
     * @param array{0: int, 1: int} $writeLimit
     * @param array{0: int, 1: int} $shareLimit
     */
    public function __construct(
        private readonly TreeTestRepository $studies,
        private readonly ProjectService $projects,
        private readonly ProjectPolicy $projectPolicy,
        private readonly UserRepository $users,
        private readonly Translator $translator,
        private readonly AuditLogger $audit,
        private readonly RateLimiter $rateLimiter,
        private readonly array $writeLimit,
        private readonly array $shareLimit,
    ) {
    }

    /** @return list<array<string, mixed>> */
    public function listForProject(User $user, string $projectPublicId): array
    {
        $project = $this->projects->getFor($user, $projectPublicId);

        return array_map(static fn (TreeTest $s): array => $s->toSummaryArray(), $this->studies->listForProject($user->id, $project->id));
    }

    /** @return list<array<string, mixed>> */
    public function listShared(User $user): array
    {
        return array_map(static fn (TreeTest $s): array => $s->toSummaryArray(), $this->studies->listSharedWith($user->id));
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(User $user, string $projectPublicId, array $input, Request $request): array
    {
        $project = $this->projects->getFor($user, $projectPublicId);
        if (!$this->projectPolicy->canUpdate($user, $project)) {
            throw HttpException::forbidden('forbidden', 'errors.project_forbidden');
        }
        $this->rateLimiter->hit('tree_test:write:user:' . $user->id, $this->writeLimit);

        $data = Validator::validate($input, ['name' => ['required', 'string', 'max:120']]);
        $defaults = TreeTestContent::defaults($this->translator);
        $publicId = $this->studies->create($project->id, $user->id, $data['name'], $defaults['content'], $defaults['settings']);
        $this->audit->record('tree_test.created', $request, $user->id, 'tree_test', $publicId, ['project' => $project->publicId]);

        return $this->show($user, $publicId);
    }

    /** @return array<string, mixed> */
    public function show(User $user, string $publicId): array
    {
        $study = $this->find($user, $publicId);

        return $study->toDetailArray($this->permissions($study));
    }

    /**
     * Full replace of the editable document. Past responses keep their own snapshot, so edits only affect new participants.
     *
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function update(User $user, string $publicId, array $input, Request $request): array
    {
        $study = $this->editable($user, $publicId);
        $this->rateLimiter->hit('tree_test:write:user:' . $user->id, $this->writeLimit);

        $p = new Payload();
        $name = $p->string($input['name'] ?? null, 'name', 120);
        $content = TreeTestContent::normalizeContent($input, $p);
        $settings = TreeTestContent::normalizeSettings($p->object($input['settings'] ?? null, 'settings'), $p);
        $p->throwIfInvalid();

        if ($study->status !== TreeTest::STATUS_DRAFT) {
            // A live study must stay runnable.
            TreeTestContent::assertPublishable($content, new Payload());
        }

        $this->studies->update($study->id, $name, $content, $settings);
        $this->audit->record('tree_test.updated', $request, $user->id, 'tree_test', $study->publicId);

        return $this->show($user, $publicId);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function changeStatus(User $user, string $publicId, array $input, Request $request): array
    {
        $study = $this->editable($user, $publicId);
        $data = Validator::validate($input, ['action' => ['required', 'string', 'in:' . implode(',', array_keys(self::STATUS_TRANSITIONS))]]);
        [$from, $to] = self::STATUS_TRANSITIONS[$data['action']];

        if (!in_array($study->status, $from, true)) {
            throw new HttpException(409, 'invalid_status', 'errors.tree_test_invalid_status');
        }

        if ($data['action'] === 'publish') {
            TreeTestContent::assertPublishable($study->content, new Payload());
            $this->studies->publish($study->id, $study->shareCode ?? $this->newShareCode(), $study->projectSlug ?? self::slug($study->projectName));
        } else {
            $this->studies->setStatus($study->id, $to);
        }
        $this->audit->record('tree_test.' . $data['action'], $request, $user->id, 'tree_test', $study->publicId);

        return $this->show($user, $publicId);
    }

    /** @param array<string, mixed> $input */
    public function delete(User $user, string $publicId, array $input, Request $request): void
    {
        $study = $this->editable($user, $publicId);
        $this->confirmName($study, $input);

        $this->studies->delete($study->id);
        $this->audit->record('tree_test.deleted', $request, $user->id, 'tree_test', $study->publicId);
    }

    /** @return array<string, mixed> */
    public function report(User $user, string $publicId): array
    {
        $study = $this->find($user, $publicId);

        return [
            'responses' => $this->studies->finishedResponses($study->id),
            'inProgressCount' => $this->studies->inProgressCount($study->id),
        ];
    }

    /** @param array<string, mixed> $input */
    public function deleteResponses(User $user, string $publicId, array $input, Request $request): void
    {
        $study = $this->editable($user, $publicId);
        $this->confirmName($study, $input);

        $deleted = $this->studies->deleteResponses($study->id);
        $this->audit->record('tree_test.responses_deleted', $request, $user->id, 'tree_test', $study->publicId, ['count' => $deleted]);
    }

    /** @return list<array<string, mixed>> */
    public function viewers(User $user, string $publicId): array
    {
        return $this->studies->viewers($this->shareable($user, $publicId)->id);
    }

    /**
     * @param array<string, mixed> $input
     * @return list<array<string, mixed>>
     */
    public function addViewer(User $user, string $publicId, array $input, Request $request): array
    {
        $study = $this->shareable($user, $publicId);
        // Limits email probing: adding by email reveals whether an account exists.
        $this->rateLimiter->hit('tree_test:share:user:' . $user->id, $this->shareLimit);

        $data = Validator::validate($input, ['email' => ['required', 'string', 'email', 'max:254']]);
        $viewer = $this->users->findByEmail(UserRepository::normalizeEmail($data['email']));

        if ($viewer === null || !$viewer->isActive()) {
            throw HttpException::validation(['email' => ['errors.member_user_not_found']]);
        }
        if ($viewer->id === $user->id || $viewer->id === $study->projectOwnerId || $this->studies->viewerExists($study->id, $viewer->id)) {
            throw HttpException::validation(['email' => ['errors.tree_test_viewer_exists']]);
        }

        $this->studies->addViewer($study->id, $viewer->id, $user->id);
        $this->audit->record('tree_test.viewer_added', $request, $user->id, 'tree_test', $study->publicId, ['viewer' => $viewer->publicId]);

        return $this->studies->viewers($study->id);
    }

    public function removeViewer(User $user, string $publicId, string $viewerPublicId, Request $request): void
    {
        $study = $this->shareable($user, $publicId);
        if (!Ulid::isValid($viewerPublicId) || $this->studies->removeViewer($study->id, $viewerPublicId) === 0) {
            throw HttpException::notFound('errors.member_not_found');
        }
        $this->audit->record('tree_test.viewer_removed', $request, $user->id, 'tree_test', $study->publicId, ['viewer' => $viewerPublicId]);
    }

    private function find(User $user, string $publicId): TreeTest
    {
        $study = Ulid::isValid($publicId) ? $this->studies->findAccessibleBy($user->id, $publicId) : null;

        return $study ?? throw HttpException::notFound('errors.tree_test_not_found');
    }

    private function editable(User $user, string $publicId): TreeTest
    {
        $study = $this->find($user, $publicId);
        if (!$this->permissions($study)['canEdit']) {
            throw HttpException::forbidden('forbidden', 'errors.tree_test_forbidden');
        }

        return $study;
    }

    private function shareable(User $user, string $publicId): TreeTest
    {
        $study = $this->find($user, $publicId);
        if (!$this->permissions($study)['canManageSharing']) {
            throw HttpException::forbidden('forbidden', 'errors.tree_test_forbidden');
        }

        return $study;
    }

    /** @return array{canEdit: bool, canManageSharing: bool} */
    private function permissions(TreeTest $study): array
    {
        $canEdit = in_array($study->accessRole, ['owner', 'editor'], true);

        return ['canEdit' => $canEdit, 'canManageSharing' => $canEdit];
    }

    /** @param array<string, mixed> $input */
    private function confirmName(TreeTest $study, array $input): void
    {
        $data = Validator::validate($input, ['confirmName' => ['required', 'string', 'max:120']]);
        if ($data['confirmName'] !== $study->name) {
            throw HttpException::validation(['confirmName' => ['errors.tree_test_confirm_name']]);
        }
    }

    private function newShareCode(): string
    {
        $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
        do {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while ($this->studies->shareCodeExists($code));

        return $code;
    }

    /** URL-safe, readable version of the project name (frozen at first publish). */
    public static function slug(string $name): string
    {
        $map = ['á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'ã' => 'a', 'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e', 'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o', 'õ' => 'o', 'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u', 'ñ' => 'n', 'ç' => 'c'];
        $slug = strtr(mb_strtolower($name), $map);
        $slug = trim((string) preg_replace('/[^a-z0-9]+/', '-', $slug), '-');
        $slug = substr($slug, 0, 60);

        return rtrim($slug, '-') !== '' ? rtrim($slug, '-') : 'proyecto';
    }
}
