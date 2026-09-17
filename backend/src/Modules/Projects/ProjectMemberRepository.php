<?php

declare(strict_types=1);

namespace Soraq\Modules\Projects;

use Soraq\Core\Database\Database;
use Soraq\Core\Support\DateFormat;

/**
 * Members of a project. Every method receives the INTERNAL project id of a project
 * already authorised by ProjectService::getFor — never an id coming from the client.
 */
final class ProjectMemberRepository
{
    public function __construct(private readonly Database $db)
    {
    }

    /**
     * Owner first, then members. Only data collaborators need: public id, name, email, role.
     *
     * @return list<array{id: string, displayName: string, email: string, role: string, addedAt: ?string}>
     */
    public function listForProject(int $projectId): array
    {
        $rows = $this->db->fetchAll(
            "SELECT u.public_id, u.display_name, u.email, 'owner' AS role, p.created_at AS added_at, 0 AS sort_group
             FROM projects p JOIN users u ON u.id = p.owner_user_id
             WHERE p.id = :owner_project
             UNION ALL
             SELECT u.public_id, u.display_name, u.email, m.role, m.created_at AS added_at, 1 AS sort_group
             FROM project_members m JOIN users u ON u.id = m.user_id
             WHERE m.project_id = :member_project
             ORDER BY sort_group, added_at",
            ['owner_project' => $projectId, 'member_project' => $projectId],
        );

        return array_map(static fn (array $row): array => [
            'id' => (string) $row['public_id'],
            'displayName' => (string) $row['display_name'],
            'email' => (string) $row['email'],
            'role' => (string) $row['role'],
            'addedAt' => DateFormat::toApi($row['added_at']),
        ], $rows);
    }

    /** @return array{id: int, role: string}|null member row by the user's PUBLIC id */
    public function findByUserPublicId(int $projectId, string $userPublicId): ?array
    {
        $row = $this->db->fetchOne(
            'SELECT m.id, m.role, u.id AS user_id FROM project_members m JOIN users u ON u.id = m.user_id
             WHERE m.project_id = :project AND u.public_id = :user',
            ['project' => $projectId, 'user' => $userPublicId],
        );

        return $row === null ? null : ['id' => (int) $row['id'], 'role' => (string) $row['role']];
    }

    public function exists(int $projectId, int $userId): bool
    {
        return $this->db->fetchOne(
            'SELECT 1 FROM project_members WHERE project_id = :project AND user_id = :user',
            ['project' => $projectId, 'user' => $userId],
        ) !== null;
    }

    public function add(int $projectId, int $userId, string $role, int $addedBy): void
    {
        $this->db->insert(
            'INSERT INTO project_members (project_id, user_id, role, added_by_user_id) VALUES (:project, :user, :role, :added_by)',
            ['project' => $projectId, 'user' => $userId, 'role' => $role, 'added_by' => $addedBy],
        );
    }

    public function updateRole(int $memberId, string $role): void
    {
        $this->db->execute('UPDATE project_members SET role = :role WHERE id = :id', ['role' => $role, 'id' => $memberId]);
    }

    public function remove(int $memberId): void
    {
        $this->db->execute('DELETE FROM project_members WHERE id = :id', ['id' => $memberId]);
    }
}
