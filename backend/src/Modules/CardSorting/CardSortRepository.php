<?php

declare(strict_types=1);

namespace Soraq\Modules\CardSorting;

use Soraq\Core\Database\Database;
use Soraq\Core\Support\DateFormat;
use Soraq\Core\Support\Ulid;

/**
 * SCOPED ACCESS (same pattern as ProjectRepository): every designer read joins the access rules in SQL.
 * A study is visible to its project's owner and members, and to users it was shared with (read-only).
 * Public (participant) lookups go only through findByShareCode(), which returns the minimum needed.
 */
final class CardSortRepository
{
    public const LIST_LIMIT = 200;

    private const JSON_FLAGS = JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR;

    private const SELECT_SCOPED = "SELECT cs.*, p.public_id AS project_public_id, p.name AS project_name, p.owner_user_id AS project_owner_id,
               CASE WHEN p.owner_user_id = :role_user THEN 'owner'
                    WHEN pm.role IS NOT NULL THEN pm.role
                    ELSE 'shared_viewer' END AS access_role,
               (SELECT COUNT(*) FROM card_sort_responses r WHERE r.card_sort_id = cs.id AND r.status <> 'in_progress') AS response_count
        FROM card_sorts cs
        JOIN projects p ON p.id = cs.project_id
        LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = :member_user
        LEFT JOIN card_sort_viewers v ON v.card_sort_id = cs.id AND v.user_id = :viewer_user
        WHERE (p.owner_user_id = :owner_user OR pm.user_id IS NOT NULL OR v.user_id IS NOT NULL)";

    public function __construct(private readonly Database $db)
    {
    }

    /** @return list<CardSort> studies of an ALREADY AUTHORISED project */
    public function listForProject(int $userId, int $projectId): array
    {
        $rows = $this->db->fetchAll(
            self::SELECT_SCOPED . ' AND cs.project_id = :project ORDER BY cs.updated_at DESC, cs.id DESC LIMIT ' . self::LIST_LIMIT,
            [...$this->scope($userId), 'project' => $projectId],
        );

        return array_map(CardSort::fromRow(...), $rows);
    }

    /** @return list<CardSort> studies shared read-only with the user, in projects they cannot access */
    public function listSharedWith(int $userId): array
    {
        $rows = $this->db->fetchAll(
            self::SELECT_SCOPED . " AND v.user_id IS NOT NULL AND p.owner_user_id <> :not_owner AND pm.user_id IS NULL
             ORDER BY cs.updated_at DESC LIMIT " . self::LIST_LIMIT,
            [...$this->scope($userId), 'not_owner' => $userId],
        );

        return array_map(CardSort::fromRow(...), $rows);
    }

    public function findAccessibleBy(int $userId, string $publicId): ?CardSort
    {
        $row = $this->db->fetchOne(self::SELECT_SCOPED . ' AND cs.public_id = :public_id', [...$this->scope($userId), 'public_id' => $publicId]);

        return $row === null ? null : CardSort::fromRow($row);
    }

    /**
     * @param array<string, mixed> $content
     * @param array<string, mixed> $settings
     */
    public function create(int $projectId, int $userId, string $name, array $content, array $settings): string
    {
        $publicId = Ulid::generate();
        $this->db->insert(
            'INSERT INTO card_sorts (public_id, project_id, created_by_user_id, name, content, settings)
             VALUES (:public_id, :project, :user, :name, :content, :settings)',
            [
                'public_id' => $publicId,
                'project' => $projectId,
                'user' => $userId,
                'name' => $name,
                'content' => json_encode($content, self::JSON_FLAGS),
                'settings' => json_encode($settings, self::JSON_FLAGS),
            ],
        );

        return $publicId;
    }

    /**
     * @param array<string, mixed> $content
     * @param array<string, mixed> $settings
     */
    public function update(int $id, string $name, string $sortType, array $content, array $settings): void
    {
        $this->db->execute(
            'UPDATE card_sorts SET name = :name, sort_type = :sort_type, content = :content, settings = :settings WHERE id = :id',
            [
                'name' => $name,
                'sort_type' => $sortType,
                'content' => json_encode($content, self::JSON_FLAGS),
                'settings' => json_encode($settings, self::JSON_FLAGS),
                'id' => $id,
            ],
        );
    }

    public function publish(int $id, string $shareCode, string $projectSlug): void
    {
        $this->db->execute(
            "UPDATE card_sorts SET status = 'active', share_code = :code, project_slug = :slug, published_at = COALESCE(published_at, UTC_TIMESTAMP()) WHERE id = :id",
            ['code' => $shareCode, 'slug' => $projectSlug, 'id' => $id],
        );
    }

    public function setStatus(int $id, string $status): void
    {
        $this->db->execute(
            'UPDATE card_sorts SET status = :status, closed_at = IF(:closing = 1, UTC_TIMESTAMP(), closed_at) WHERE id = :id',
            ['status' => $status, 'closing' => $status === CardSort::STATUS_CLOSED ? 1 : 0, 'id' => $id],
        );
    }

    public function shareCodeExists(string $code): bool
    {
        return $this->db->fetchOne('SELECT 1 FROM card_sorts WHERE share_code = :code', ['code' => $code]) !== null;
    }

    public function delete(int $id): void
    {
        $this->db->execute('DELETE FROM card_sorts WHERE id = :id', ['id' => $id]);
    }

    // ── Participants (public) ──────────────────────────────────────────────

    /** @return array{id: int, status: string, sortType: string, content: array<string, mixed>, settings: array<string, mixed>, projectSlug: ?string}|null */
    public function findByShareCode(string $code): ?array
    {
        $row = $this->db->fetchOne(
            "SELECT id, status, sort_type, content, settings, project_slug FROM card_sorts WHERE share_code = :code AND status <> 'draft'",
            ['code' => $code],
        );

        return $row === null ? null : [
            'id' => (int) $row['id'],
            'status' => (string) $row['status'],
            'sortType' => (string) $row['sort_type'],
            'content' => json_decode((string) $row['content'], true) ?: [],
            'settings' => json_decode((string) $row['settings'], true) ?: [],
            'projectSlug' => $row['project_slug'] !== null ? (string) $row['project_slug'] : null,
        ];
    }

    /** @param array<string, mixed> $snapshot */
    public function startResponse(int $cardSortId, string $tokenHash, array $snapshot): void
    {
        $this->db->insert(
            'INSERT INTO card_sort_responses (card_sort_id, token_hash, snapshot) VALUES (:study, :token, :snapshot)',
            ['study' => $cardSortId, 'token' => $tokenHash, 'snapshot' => json_encode($snapshot, self::JSON_FLAGS)],
        );
    }

    /** @return array{id: int, status: string, screeningPassed: bool, snapshot: array<string, mixed>}|null */
    public function findResponse(int $cardSortId, string $tokenHash): ?array
    {
        $row = $this->db->fetchOne(
            'SELECT id, status, screening_passed, snapshot FROM card_sort_responses WHERE card_sort_id = :study AND token_hash = :token',
            ['study' => $cardSortId, 'token' => $tokenHash],
        );

        return $row === null ? null : [
            'id' => (int) $row['id'],
            'status' => (string) $row['status'],
            'screeningPassed' => (bool) $row['screening_passed'],
            'snapshot' => json_decode((string) $row['snapshot'], true) ?: [],
        ];
    }

    /** @param array<string, mixed> $answers */
    public function saveScreening(int $responseId, array $answers, bool $passed): void
    {
        $this->db->execute(
            'UPDATE card_sort_responses SET screening_answers = :answers, screening_passed = :passed WHERE id = :id',
            ['answers' => json_encode($answers, self::JSON_FLAGS), 'passed' => $passed ? 1 : 0, 'id' => $responseId],
        );
    }

    /**
     * Finishes a response and gives it the next participant number of the study (serialised by locking the study row).
     *
     * @param array<string, mixed>|null $postAnswers
     * @param list<array<string, mixed>>|null $categories
     */
    public function finishResponse(int $cardSortId, int $responseId, string $status, ?array $postAnswers, ?array $categories): void
    {
        $this->db->transaction(function (Database $db) use ($cardSortId, $responseId, $status, $postAnswers, $categories): void {
            $db->fetchOne('SELECT id FROM card_sorts WHERE id = :id FOR UPDATE', ['id' => $cardSortId]);
            $next = (int) ($db->fetchOne(
                'SELECT COALESCE(MAX(participant_number), 0) + 1 AS next FROM card_sort_responses WHERE card_sort_id = :study',
                ['study' => $cardSortId],
            )['next'] ?? 1);

            $db->execute(
                'UPDATE card_sort_responses
                 SET status = :status, participant_number = :number, post_answers = :post, sort_result = :result,
                     finished_at = UTC_TIMESTAMP(), duration_seconds = TIMESTAMPDIFF(SECOND, started_at, UTC_TIMESTAMP())
                 WHERE id = :id AND status = \'in_progress\'',
                [
                    'status' => $status,
                    'number' => $next,
                    'post' => $postAnswers === null ? null : json_encode($postAnswers, self::JSON_FLAGS),
                    'result' => $categories === null ? null : json_encode($categories, self::JSON_FLAGS),
                    'id' => $responseId,
                ],
            );
        });
    }

    // ── Report ─────────────────────────────────────────────────────────────

    /** @return list<array<string, mixed>> finished responses, oldest first */
    public function finishedResponses(int $cardSortId): array
    {
        $rows = $this->db->fetchAll(
            "SELECT participant_number, status, snapshot, screening_answers, post_answers, sort_result, started_at, finished_at, duration_seconds
             FROM card_sort_responses WHERE card_sort_id = :study AND status <> 'in_progress' ORDER BY participant_number LIMIT 5000",
            ['study' => $cardSortId],
        );

        $decode = static fn (mixed $json): mixed => is_string($json) ? json_decode($json, true) : null;

        return array_map(static fn (array $row): array => [
            'number' => (int) $row['participant_number'],
            'status' => (string) $row['status'],
            'snapshot' => $decode($row['snapshot']),
            'screeningAnswers' => $decode($row['screening_answers']) ?? new \stdClass(),
            'postAnswers' => $decode($row['post_answers']) ?? new \stdClass(),
            'categories' => $decode($row['sort_result']) ?? [],
            'startedAt' => DateFormat::toApi($row['started_at']),
            'finishedAt' => DateFormat::toApi($row['finished_at']),
            'durationSeconds' => $row['duration_seconds'] !== null ? (int) $row['duration_seconds'] : null,
        ], $rows);
    }

    public function inProgressCount(int $cardSortId): int
    {
        return (int) ($this->db->fetchOne(
            "SELECT COUNT(*) AS total FROM card_sort_responses WHERE card_sort_id = :study AND status = 'in_progress'",
            ['study' => $cardSortId],
        )['total'] ?? 0);
    }

    public function deleteResponses(int $cardSortId): int
    {
        return $this->db->execute('DELETE FROM card_sort_responses WHERE card_sort_id = :study', ['study' => $cardSortId]);
    }

    // ── Read-only sharing ──────────────────────────────────────────────────

    /** @return list<array{id: string, displayName: string, email: string, addedAt: ?string}> */
    public function viewers(int $cardSortId): array
    {
        $rows = $this->db->fetchAll(
            'SELECT u.public_id, u.display_name, u.email, v.created_at FROM card_sort_viewers v JOIN users u ON u.id = v.user_id
             WHERE v.card_sort_id = :study ORDER BY v.created_at LIMIT 200',
            ['study' => $cardSortId],
        );

        return array_map(static fn (array $row): array => [
            'id' => (string) $row['public_id'],
            'displayName' => (string) $row['display_name'],
            'email' => (string) $row['email'],
            'addedAt' => DateFormat::toApi($row['created_at']),
        ], $rows);
    }

    public function viewerExists(int $cardSortId, int $userId): bool
    {
        return $this->db->fetchOne('SELECT 1 FROM card_sort_viewers WHERE card_sort_id = :study AND user_id = :user', ['study' => $cardSortId, 'user' => $userId]) !== null;
    }

    public function addViewer(int $cardSortId, int $userId, int $addedBy): void
    {
        $this->db->insert(
            'INSERT INTO card_sort_viewers (card_sort_id, user_id, added_by_user_id) VALUES (:study, :user, :added_by)',
            ['study' => $cardSortId, 'user' => $userId, 'added_by' => $addedBy],
        );
    }

    public function removeViewer(int $cardSortId, string $userPublicId): int
    {
        return $this->db->execute(
            'DELETE v FROM card_sort_viewers v JOIN users u ON u.id = v.user_id WHERE v.card_sort_id = :study AND u.public_id = :user',
            ['study' => $cardSortId, 'user' => $userPublicId],
        );
    }

    /** @return array<string, int> */
    private function scope(int $userId): array
    {
        return ['role_user' => $userId, 'member_user' => $userId, 'viewer_user' => $userId, 'owner_user' => $userId];
    }
}
