<?php

declare(strict_types=1);

namespace Soraq\Modules\Projects;

use Soraq\Modules\Users\User;

/**
 * AUTHORIZATION POLICY — the single place that answers "may this user do X to this project?".
 *
 * | Action           | owner | editor | viewer |
 * |------------------|:-----:|:------:|:------:|
 * | view             |   ✔   |   ✔    |   ✔    |
 * | update (details) |   ✔   |   ✔    |        |
 * | view members     |   ✔   |   ✔    |   ✔    |
 * | manage members   |   ✔   |        |        |
 * | delete           |   ✔   |        |        |
 * | leave            |       |   ✔    |   ✔    |
 *
 * Platform role `admin` grants NOTHING here (docs/decisions/0009).
 * `accessRole` comes from the scoped repository query, so a project the user cannot
 * access never reaches the policy.
 */
final class ProjectPolicy
{
    public function canView(User $user, Project $project): bool
    {
        return in_array($project->accessRole, [Project::ROLE_OWNER, Project::ROLE_EDITOR, Project::ROLE_VIEWER], true);
    }

    public function canUpdate(User $user, Project $project): bool
    {
        return in_array($project->accessRole, [Project::ROLE_OWNER, Project::ROLE_EDITOR], true);
    }

    public function canManageMembers(User $user, Project $project): bool
    {
        return $this->isOwner($user, $project);
    }

    public function canDelete(User $user, Project $project): bool
    {
        return $this->isOwner($user, $project);
    }

    public function canLeave(User $user, Project $project): bool
    {
        return !$this->isOwner($user, $project) && $this->canView($user, $project);
    }

    private function isOwner(User $user, Project $project): bool
    {
        return $project->accessRole === Project::ROLE_OWNER && $project->ownerUserId === $user->id;
    }
}
