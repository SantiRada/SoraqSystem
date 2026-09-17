<?php

declare(strict_types=1);

namespace Soraq\Modules\ProductContext;

use Soraq\Core\Database\Database;

/** Latest stored summary per project. Receives only internal ids of already-authorised projects. */
final class ContextPromptRepository
{
    public function __construct(private readonly Database $db)
    {
    }

    /** @return array{summary: string, sourceHash: string, noteCount: int, model: string, generatedAt: string}|null */
    public function find(int $projectId): ?array
    {
        $row = $this->db->fetchOne(
            'SELECT summary, source_hash, note_count, model, generated_at FROM project_context_prompts WHERE project_id = :project',
            ['project' => $projectId],
        );

        return $row === null ? null : [
            'summary' => (string) $row['summary'],
            'sourceHash' => (string) $row['source_hash'],
            'noteCount' => (int) $row['note_count'],
            'model' => (string) $row['model'],
            'generatedAt' => (string) $row['generated_at'],
        ];
    }

    public function save(int $projectId, string $summary, string $sourceHash, int $noteCount, string $model, int $userId): void
    {
        $this->db->execute(
            'INSERT INTO project_context_prompts (project_id, summary, source_hash, note_count, model, generated_by_user_id, generated_at)
             VALUES (:project, :summary, :hash, :count, :model, :user, UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE summary = VALUES(summary), source_hash = VALUES(source_hash), note_count = VALUES(note_count),
                 model = VALUES(model), generated_by_user_id = VALUES(generated_by_user_id), generated_at = VALUES(generated_at)',
            ['project' => $projectId, 'summary' => $summary, 'hash' => $sourceHash, 'count' => $noteCount, 'model' => $model, 'user' => $userId],
        );
    }
}
