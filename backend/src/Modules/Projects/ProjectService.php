<?php

declare(strict_types=1);

namespace Soraq\Modules\Projects;

use Soraq\Core\Audit\AuditLogger;
use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Support\Ulid;
use Soraq\Core\Validation\Validator;
use Soraq\Modules\Users\User;

final class ProjectService
{
    /** @param array{0: int, 1: int} $createLimit */
    public function __construct(
        private readonly ProjectRepository $projects,
        private readonly ProjectPolicy $policy,
        private readonly AuditLogger $audit,
        private readonly RateLimiter $rateLimiter,
        private readonly array $createLimit,
    ) {
    }

    /** @return list<Project> */
    public function listFor(User $user): array
    {
        return $this->projects->listAccessibleBy($user->id);
    }

    /**
     * Missing, malformed and inaccessible projects all return the same 404,
     * so nobody can learn whether an id exists (IDOR / enumeration).
     */
    public function getFor(User $user, string $publicId): Project
    {
        $project = Ulid::isValid($publicId) ? $this->projects->findAccessibleBy($user->id, $publicId) : null;

        if ($project === null || !$this->policy->canView($user, $project)) {
            throw HttpException::notFound('errors.project_not_found');
        }

        return $project;
    }

    /** @param array<string, mixed> $input */
    public function create(User $user, array $input, Request $request): Project
    {
        $this->rateLimiter->hit('project:create:user:' . $user->id, $this->createLimit);

        $data = $this->validateDetails($input);
        $project = $this->projects->create($user->id, $data['name'], $data['description']);

        $this->audit->record('project.created', $request, $user->id, 'project', $project->publicId);

        return $project;
    }

    /** @param array<string, mixed> $input */
    public function update(User $user, string $publicId, array $input, Request $request): Project
    {
        $project = $this->getFor($user, $publicId);

        // The user CAN see the project, so a 403 reveals nothing new.
        if (!$this->policy->canUpdate($user, $project)) {
            throw HttpException::forbidden('forbidden', 'errors.project_forbidden');
        }

        $data = $this->validateDetails($input);
        $this->projects->update($project->id, $data['name'], $data['description']);
        $this->audit->record('project.updated', $request, $user->id, 'project', $project->publicId);

        return $this->getFor($user, $publicId);
    }

    /** @param array<string, mixed> $input */
    public function delete(User $user, string $publicId, array $input, Request $request): void
    {
        $project = $this->getFor($user, $publicId);

        if (!$this->policy->canDelete($user, $project)) {
            throw HttpException::forbidden('forbidden', 'errors.project_forbidden');
        }

        // Server-side confirmation: the exact project name must be typed.
        $data = Validator::validate($input, ['confirmName' => ['required', 'string', 'max:120']]);
        if ($data['confirmName'] !== $project->name) {
            throw HttpException::validation(['confirmName' => ['errors.project_delete_confirmation']]);
        }

        $this->projects->delete($project->id);
        $this->audit->record('project.deleted', $request, $user->id, 'project', $project->publicId);
    }

    /**
     * @param array<string, mixed> $input
     * @return array{name: string, description: ?string}
     */
    private function validateDetails(array $input): array
    {
        /** @var array{name: string, description: ?string} */
        return Validator::validate($input, [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
