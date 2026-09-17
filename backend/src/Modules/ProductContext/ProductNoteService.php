<?php

declare(strict_types=1);

namespace Soraq\Modules\ProductContext;

use Soraq\Core\Audit\AuditLogger;
use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Support\Ulid;
use Soraq\Core\Validation\Validator;
use Soraq\Modules\Projects\Project;
use Soraq\Modules\Projects\ProjectPolicy;
use Soraq\Modules\Projects\ProjectService;
use Soraq\Modules\Users\User;

/**
 * Investigación → Producto. Permissions reuse ProjectPolicy:
 * view = any project access · create/update/delete = owner|editor.
 */
final class ProductNoteService
{
    public const TITLE_MAX = 120;
    public const BODY_MAX = 5000;

    /** @param array{0: int, 1: int} $writeLimit */
    public function __construct(
        private readonly ProjectService $projects,
        private readonly ProjectPolicy $policy,
        private readonly ProductNoteRepository $notes,
        private readonly AuditLogger $audit,
        private readonly RateLimiter $rateLimiter,
        private readonly array $writeLimit,
    ) {
    }

    /** @return list<array<string, mixed>> */
    public function list(User $user, string $projectPublicId): array
    {
        return $this->notes->listForProject($this->projects->getFor($user, $projectPublicId)->id);
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function create(User $user, string $projectPublicId, array $input, Request $request): array
    {
        $project = $this->editableProject($user, $projectPublicId);
        $this->rateLimiter->hit('product_note:write:user:' . $user->id, $this->writeLimit);
        $data = $this->validate($input);

        if ($this->notes->countForProject($project->id) >= ProductNoteRepository::MAX_PER_PROJECT) {
            throw new HttpException(409, 'limit_reached', 'errors.product_notes_limit', ['max' => ProductNoteRepository::MAX_PER_PROJECT]);
        }

        $note = $this->notes->create($project->id, $user->id, $data['title'], $data['body']);
        $this->audit->record('product_note.created', $request, $user->id, 'project', $project->publicId, ['note' => $note['id']]);

        return $note;
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function update(User $user, string $projectPublicId, string $notePublicId, array $input, Request $request): array
    {
        $project = $this->editableProject($user, $projectPublicId);
        $this->findNote($project, $notePublicId);
        $this->rateLimiter->hit('product_note:write:user:' . $user->id, $this->writeLimit);
        $data = $this->validate($input);

        $this->notes->update($project->id, $notePublicId, $data['title'], $data['body']);
        $this->audit->record('product_note.updated', $request, $user->id, 'project', $project->publicId, ['note' => $notePublicId]);

        return $this->findNote($project, $notePublicId);
    }

    public function delete(User $user, string $projectPublicId, string $notePublicId, Request $request): void
    {
        $project = $this->editableProject($user, $projectPublicId);
        $this->findNote($project, $notePublicId);

        $this->notes->delete($project->id, $notePublicId);
        $this->audit->record('product_note.deleted', $request, $user->id, 'project', $project->publicId, ['note' => $notePublicId]);
    }

    private function editableProject(User $user, string $projectPublicId): Project
    {
        $project = $this->projects->getFor($user, $projectPublicId);

        if (!$this->policy->canUpdate($user, $project)) {
            throw HttpException::forbidden('forbidden', 'errors.project_forbidden');
        }

        return $project;
    }

    /**
     * Scoped by project: a note of another project (or a malformed id) is the same 404.
     *
     * @return array<string, mixed>
     */
    private function findNote(Project $project, string $notePublicId): array
    {
        $note = Ulid::isValid($notePublicId) ? $this->notes->find($project->id, $notePublicId) : null;

        return $note ?? throw HttpException::notFound('errors.product_note_not_found');
    }

    /**
     * @param array<string, mixed> $input
     * @return array{title: string, body: string}
     */
    private function validate(array $input): array
    {
        /** @var array{title: string, body: string} */
        return Validator::validate($input, [
            'title' => ['required', 'string', 'max:' . self::TITLE_MAX],
            'body' => ['required', 'string', 'max:' . self::BODY_MAX],
        ]);
    }
}
