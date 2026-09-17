<?php

declare(strict_types=1);

namespace Soraq\Modules\Projects;

use Soraq\Core\Database\Database;
use Soraq\Core\Support\Ulid;

/**
 * SCOPED ACCESS PATTERN (reference for every future module):
 * every read query includes the access scope in the SQL itself —
 * the user is the owner OR has a row in project_members.
 * There is intentionally no unscoped findByPublicId().
 */
final class ProjectRepository
{
    public const LIST_LIMIT = 200;

    /** Resolves the caller's role in the same query that enforces access. */
    private const SELECT_SCOPED = "SELECT p.id, p.public_id, p.owner_user_id, p.name, p.description, p.created_at, p.updated_at,
               CASE WHEN p.owner_user_id = :role_user THEN 'owner' ELSE m.role END AS access_role
        FROM projects p
        LEFT JOIN project_members m ON m.project_id = p.id AND m.user_id = :member_user
        WHERE (p.owner_user_id = :owner_user OR m.user_id IS NOT NULL)";

    public function __construct(private readonly Database $db)
    {
    }

    /** @return list<Project> */
    public function listAccessibleBy(int $userId): array
    {
        $rows = $this->db->fetchAll(
            self::SELECT_SCOPED . ' ORDER BY p.updated_at DESC, p.id DESC LIMIT ' . self::LIST_LIMIT,
            $this->scope($userId),
        );

        return array_map(Project::fromRow(...), $rows);
    }

    public function findAccessibleBy(int $userId, string $publicId): ?Project
    {
        $row = $this->db->fetchOne(
            self::SELECT_SCOPED . ' AND p.public_id = :public_id',
            [...$this->scope($userId), 'public_id' => $publicId],
        );

        return $row === null ? null : Project::fromRow($row);
    }

    public function create(int $ownerUserId, string $name, ?string $description): Project
    {
        $publicId = Ulid::generate();

        $this->db->insert(
            'INSERT INTO projects (public_id, owner_user_id, name, description)
             VALUES (:public_id, :owner, :name, :description)',
            ['public_id' => $publicId, 'owner' => $ownerUserId, 'name' => $name, 'description' => $description],
        );

        return $this->findAccessibleBy($ownerUserId, $publicId) ?? throw new \RuntimeException('Project not found after insert.');
    }

    /** Caller must have checked ProjectPolicy::canUpdate. */
    public function update(int $projectId, string $name, ?string $description): void
    {
        $this->db->execute(
            'UPDATE projects SET name = :name, description = :description WHERE id = :id',
            ['name' => $name, 'description' => $description, 'id' => $projectId],
        );
    }

    /** Caller must have checked ProjectPolicy::canDelete. Memberships cascade. */
    public function delete(int $projectId): void
    {
        $this->db->execute('DELETE FROM projects WHERE id = :id', ['id' => $projectId]);
    }

    /** Named placeholders cannot repeat with native prepares: one per usage. */
    private function scope(int $userId): array
    {
        return ['role_user' => $userId, 'member_user' => $userId, 'owner_user' => $userId];
    }
}
