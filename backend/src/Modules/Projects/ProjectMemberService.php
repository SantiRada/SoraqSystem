<?php

declare(strict_types=1);

namespace Soraq\Modules\Projects;

use Soraq\Core\Audit\AuditLogger;
use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Validation\Validator;
use Soraq\Modules\Users\User;
use Soraq\Modules\Users\UserRepository;

/**
 * Project access management. The project is ALWAYS resolved first through
 * ProjectService::getFor (scoped query → 404 for outsiders), then the policy decides.
 *
 * Members are existing Soraq accounts (no email invitations yet — docs/modules/workspace.md).
 */
final class ProjectMemberService
{
    /** @param array{0: int, 1: int} $inviteLimit */
    public function __construct(
        private readonly ProjectService $projects,
        private readonly ProjectMemberRepository $members,
        private readonly UserRepository $users,
        private readonly ProjectPolicy $policy,
        private readonly AuditLogger $audit,
        private readonly RateLimiter $rateLimiter,
        private readonly array $inviteLimit,
    ) {
    }

    /** @return list<array<string, mixed>> */
    public function list(User $user, string $projectPublicId): array
    {
        $project = $this->projects->getFor($user, $projectPublicId);

        return $this->members->listForProject($project->id);
    }

    /**
     * @param array<string, mixed> $input
     * @return list<array<string, mixed>>
     */
    public function add(User $user, string $projectPublicId, array $input, Request $request): array
    {
        $project = $this->manageable($user, $projectPublicId);
        // Limits email probing: adding by email reveals whether an account exists.
        $this->rateLimiter->hit('project:members:user:' . $user->id, $this->inviteLimit);

        $data = Validator::validate($input, [
            'email' => ['required', 'string', 'email', 'max:254'],
            'role' => ['required', 'string', 'in:' . implode(',', Project::MEMBER_ROLES)],
        ]);

        $invitee = $this->users->findByEmail(UserRepository::normalizeEmail($data['email']));

        if ($invitee === null || !$invitee->isActive()) {
            throw HttpException::validation(['email' => ['errors.member_user_not_found']]);
        }
        if ($invitee->id === $project->ownerUserId) {
            throw HttpException::validation(['email' => ['errors.member_is_owner']]);
        }
        if ($this->members->exists($project->id, $invitee->id)) {
            throw HttpException::validation(['email' => ['errors.member_already_exists']]);
        }

        $this->members->add($project->id, $invitee->id, $data['role'], $user->id);
        $this->audit->record('project.member_added', $request, $user->id, 'project', $project->publicId, [
            'member' => $invitee->publicId,
            'role' => $data['role'],
        ]);

        return $this->members->listForProject($project->id);
    }

    /**
     * @param array<string, mixed> $input
     * @return list<array<string, mixed>>
     */
    public function updateRole(User $user, string $projectPublicId, string $memberPublicId, array $input, Request $request): array
    {
        $project = $this->manageable($user, $projectPublicId);

        $data = Validator::validate($input, [
            'role' => ['required', 'string', 'in:' . implode(',', Project::MEMBER_ROLES)],
        ]);

        $member = $this->members->findByUserPublicId($project->id, $memberPublicId)
            ?? throw HttpException::notFound('errors.member_not_found');

        $this->members->updateRole($member['id'], $data['role']);
        $this->audit->record('project.member_role_changed', $request, $user->id, 'project', $project->publicId, [
            'member' => $memberPublicId,
            'role' => $data['role'],
        ]);

        return $this->members->listForProject($project->id);
    }

    /** Owners remove anyone; editors/viewers may only remove themselves ("leave"). */
    public function remove(User $user, string $projectPublicId, string $memberPublicId, Request $request): void
    {
        $project = $this->projects->getFor($user, $projectPublicId);
        $isSelf = $memberPublicId === $user->publicId;

        $allowed = $isSelf ? $this->policy->canLeave($user, $project) : $this->policy->canManageMembers($user, $project);
        if (!$allowed) {
            throw HttpException::forbidden('forbidden', 'errors.project_forbidden');
        }

        $member = $this->members->findByUserPublicId($project->id, $memberPublicId)
            ?? throw HttpException::notFound('errors.member_not_found');

        $this->members->remove($member['id']);
        $this->audit->record($isSelf ? 'project.left' : 'project.member_removed', $request, $user->id, 'project', $project->publicId, [
            'member' => $memberPublicId,
        ]);
    }

    private function manageable(User $user, string $projectPublicId): Project
    {
        $project = $this->projects->getFor($user, $projectPublicId);

        if (!$this->policy->canManageMembers($user, $project)) {
            throw HttpException::forbidden('forbidden', 'errors.project_forbidden');
        }

        return $project;
    }
}
