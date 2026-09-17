<?php

declare(strict_types=1);

namespace Soraq\Modules\TreeTesting;

use Soraq\Core\Support\DateFormat;

final class TreeTest
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAUSED = 'paused';
    public const STATUS_CLOSED = 'closed';

    /**
     * @param array<string, mixed> $content
     * @param array<string, mixed> $settings
     */
    public function __construct(
        public readonly int $id,
        public readonly string $publicId,
        public readonly int $projectId,
        public readonly string $projectPublicId,
        public readonly string $projectName,
        public readonly int $projectOwnerId,
        public readonly string $name,
        public readonly string $status,
        public readonly array $content,
        public readonly array $settings,
        public readonly ?string $shareCode,
        public readonly ?string $projectSlug,
        public readonly ?string $publishedAt,
        public readonly ?string $closedAt,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly string $accessRole,
        public readonly int $responseCount,
    ) {
    }

    /** @param array<string, mixed> $row */
    public static function fromRow(array $row): self
    {
        $decode = static function (mixed $json): array {
            $data = is_string($json) ? json_decode($json, true) : null;

            return is_array($data) ? $data : [];
        };

        return new self(
            id: (int) $row['id'],
            publicId: (string) $row['public_id'],
            projectId: (int) $row['project_id'],
            projectPublicId: (string) $row['project_public_id'],
            projectName: (string) $row['project_name'],
            projectOwnerId: (int) $row['project_owner_id'],
            name: (string) $row['name'],
            status: (string) $row['status'],
            content: $decode($row['content']),
            settings: $decode($row['settings']),
            shareCode: $row['share_code'] !== null ? (string) $row['share_code'] : null,
            projectSlug: $row['project_slug'] !== null ? (string) $row['project_slug'] : null,
            publishedAt: $row['published_at'] !== null ? (string) $row['published_at'] : null,
            closedAt: $row['closed_at'] !== null ? (string) $row['closed_at'] : null,
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
            accessRole: (string) $row['access_role'],
            responseCount: (int) ($row['response_count'] ?? 0),
        );
    }

    public function publicPath(): ?string
    {
        return $this->shareCode !== null && $this->status !== self::STATUS_DRAFT ? '/treetesting/' . $this->projectSlug . '/' . $this->shareCode : null;
    }

    /** @return array<string, mixed> */
    public function toSummaryArray(): array
    {
        return [
            'id' => $this->publicId,
            'name' => $this->name,
            'status' => $this->status,
            'nodeCount' => count(TreeTestContent::nodeIds($this->content['tree'] ?? [])),
            'taskCount' => count($this->content['tasks'] ?? []),
            'responseCount' => $this->responseCount,
            'project' => ['id' => $this->projectPublicId, 'name' => $this->projectName],
            'accessRole' => $this->accessRole,
            'updatedAt' => DateFormat::toApi($this->updatedAt),
        ];
    }

    /**
     * @param array{canEdit: bool, canManageSharing: bool} $permissions
     * @return array<string, mixed>
     */
    public function toDetailArray(array $permissions): array
    {
        $settings = $this->settings;
        $settings['socialLinks'] = ($settings['socialLinks'] ?? []) === [] ? new \stdClass() : $settings['socialLinks'];

        return $this->toSummaryArray() + [
            'purpose' => $this->content['purpose'],
            'participantRequirements' => $this->content['participantRequirements'],
            'tree' => $this->content['tree'],
            'tasks' => $this->content['tasks'],
            'flow' => $this->content['flow'],
            'settings' => $settings,
            'publicPath' => $this->publicPath(),
            'permissions' => $permissions,
            'publishedAt' => DateFormat::toApi($this->publishedAt),
            'closedAt' => DateFormat::toApi($this->closedAt),
            'createdAt' => DateFormat::toApi($this->createdAt),
        ];
    }
}
