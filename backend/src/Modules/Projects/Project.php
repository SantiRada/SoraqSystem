<?php

declare(strict_types=1);

namespace Soraq\Modules\Projects;

use Soraq\Core\Support\DateFormat;

final class Project
{
    public const ROLE_OWNER = 'owner';
    public const ROLE_EDITOR = 'editor';
    public const ROLE_VIEWER = 'viewer';

    /** Roles that can be granted to members (owner is never a membership). */
    public const MEMBER_ROLES = [self::ROLE_EDITOR, self::ROLE_VIEWER];

    public function __construct(
        public readonly int $id,
        public readonly string $publicId,
        public readonly int $ownerUserId,
        public readonly string $name,
        public readonly ?string $description,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        /** The CURRENT user's role on this project, resolved by the scoped query. */
        public readonly string $accessRole,
    ) {
    }

    /** @param array<string, mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            id: (int) $row['id'],
            publicId: (string) $row['public_id'],
            ownerUserId: (int) $row['owner_user_id'],
            name: (string) $row['name'],
            description: $row['description'] !== null ? (string) $row['description'] : null,
            createdAt: (string) $row['created_at'],
            updatedAt: (string) $row['updated_at'],
            accessRole: (string) $row['access_role'],
        );
    }

    /** Internal ids (id, owner_user_id) never leave the backend. */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->publicId,
            'name' => $this->name,
            'description' => $this->description,
            'accessRole' => $this->accessRole,
            'createdAt' => DateFormat::toApi($this->createdAt),
            'updatedAt' => DateFormat::toApi($this->updatedAt),
        ];
    }
}
