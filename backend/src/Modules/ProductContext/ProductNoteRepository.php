<?php

declare(strict_types=1);

namespace Soraq\Modules\ProductContext;

use Soraq\Core\Database\Database;
use Soraq\Core\Support\DateFormat;
use Soraq\Core\Support\Ulid;

/**
 * Product notes. Every method receives the INTERNAL id of a project already authorised by
 * ProjectService::getFor, and every query is scoped by it: a note id from another project never matches.
 */
final class ProductNoteRepository
{
    /** Notes allowed per project (enforced on create; also the list bound). */
    public const MAX_PER_PROJECT = 200;

    private const SELECT = 'SELECT n.id, n.public_id, n.title, n.body, n.created_at, n.updated_at, u.display_name AS author_name
         FROM product_notes n LEFT JOIN users u ON u.id = n.author_user_id';

    public function __construct(private readonly Database $db)
    {
    }

    /** @return list<array<string, mixed>> newest first */
    public function listForProject(int $projectId): array
    {
        $rows = $this->db->fetchAll(
            self::SELECT . ' WHERE n.project_id = :project ORDER BY n.created_at DESC, n.id DESC LIMIT ' . self::MAX_PER_PROJECT,
            ['project' => $projectId],
        );

        return array_map(self::toPublicArray(...), $rows);
    }

    /**
     * Title and body only, oldest first (stable order for summaries and fingerprints).
     *
     * @return list<array{id: string, title: string, body: string}>
     */
    public function contentForProject(int $projectId): array
    {
        $rows = $this->db->fetchAll(
            'SELECT public_id, title, body FROM product_notes WHERE project_id = :project ORDER BY id LIMIT ' . self::MAX_PER_PROJECT,
            ['project' => $projectId],
        );

        return array_map(static fn (array $row): array => [
            'id' => (string) $row['public_id'],
            'title' => (string) $row['title'],
            'body' => (string) $row['body'],
        ], $rows);
    }

    public function countForProject(int $projectId): int
    {
        return (int) ($this->db->fetchOne('SELECT COUNT(*) AS total FROM product_notes WHERE project_id = :project', ['project' => $projectId])['total'] ?? 0);
    }

    /** @return array<string, mixed>|null */
    public function find(int $projectId, string $notePublicId): ?array
    {
        $row = $this->db->fetchOne(self::SELECT . ' WHERE n.project_id = :project AND n.public_id = :note', ['project' => $projectId, 'note' => $notePublicId]);

        return $row === null ? null : self::toPublicArray($row);
    }

    /** @return array<string, mixed> */
    public function create(int $projectId, int $authorUserId, string $title, string $body): array
    {
        $publicId = Ulid::generate();
        $this->db->insert(
            'INSERT INTO product_notes (public_id, project_id, author_user_id, title, body) VALUES (:public_id, :project, :author, :title, :body)',
            ['public_id' => $publicId, 'project' => $projectId, 'author' => $authorUserId, 'title' => $title, 'body' => $body],
        );

        return $this->find($projectId, $publicId) ?? throw new \RuntimeException('Note not found after insert.');
    }

    public function update(int $projectId, string $notePublicId, string $title, string $body): void
    {
        $this->db->execute(
            'UPDATE product_notes SET title = :title, body = :body WHERE project_id = :project AND public_id = :note',
            ['title' => $title, 'body' => $body, 'project' => $projectId, 'note' => $notePublicId],
        );
    }

    public function delete(int $projectId, string $notePublicId): void
    {
        $this->db->execute('DELETE FROM product_notes WHERE project_id = :project AND public_id = :note', ['project' => $projectId, 'note' => $notePublicId]);
    }

    /**
     * @param array<string, mixed> $row
     * @return array{id: string, title: string, body: string, authorName: ?string, createdAt: ?string, updatedAt: ?string}
     */
    private static function toPublicArray(array $row): array
    {
        return [
            'id' => (string) $row['public_id'],
            'title' => (string) $row['title'],
            'body' => (string) $row['body'],
            'authorName' => $row['author_name'] !== null ? (string) $row['author_name'] : null,
            'createdAt' => DateFormat::toApi($row['created_at']),
            'updatedAt' => DateFormat::toApi($row['updated_at']),
        ];
    }
}
