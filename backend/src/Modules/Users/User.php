<?php

declare(strict_types=1);

namespace Soraq\Modules\Users;

use Soraq\Core\Support\DateFormat;

/**
 * User entity. Contains the password hash, so it must NEVER be serialized
 * directly — always use toPublicArray().
 */
final class User
{
    public const STATUS_ACTIVE = 'active';
    public const ROLE_USER = 'user';
    public const ROLE_ADMIN = 'admin';

    public function __construct(
        public readonly int $id,
        public readonly string $publicId,
        public readonly string $email,
        public readonly string $passwordHash,
        public readonly string $displayName,
        public readonly string $locale,
        public readonly string $timezone,
        public readonly string $status,
        public readonly string $role,
        public readonly int $authVersion,
        public readonly string $createdAt,
    ) {
    }

    /** @param array<string, mixed> $row */
    public static function fromRow(array $row): self
    {
        return new self(
            id: (int) $row['id'],
            publicId: (string) $row['public_id'],
            email: (string) $row['email'],
            passwordHash: (string) $row['password_hash'],
            displayName: (string) $row['display_name'],
            locale: (string) $row['locale'],
            timezone: (string) $row['timezone'],
            status: (string) $row['status'],
            role: (string) $row['role'],
            authVersion: (int) $row['auth_version'],
            createdAt: (string) $row['created_at'],
        );
    }

    /** Platform administration only. Never grants access to other users' data (ADR 0009). */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /** The only shape of a user that may leave the backend (the user's OWN profile). */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->publicId,
            'email' => $this->email,
            'displayName' => $this->displayName,
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'role' => $this->role,
            'createdAt' => DateFormat::toApi($this->createdAt),
        ];
    }
}
