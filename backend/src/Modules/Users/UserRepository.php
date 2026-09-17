<?php

declare(strict_types=1);

namespace Soraq\Modules\Users;

use Soraq\Core\Database\Database;
use Soraq\Core\Support\Ulid;

final class UserRepository
{
    private const COLUMNS = 'id, public_id, email, password_hash, display_name, locale, timezone, status, role, auth_version, created_at';

    public function __construct(private readonly Database $db)
    {
    }

    public function findById(int $id): ?User
    {
        $row = $this->db->fetchOne('SELECT ' . self::COLUMNS . ' FROM users WHERE id = :id', ['id' => $id]);

        return $row === null ? null : User::fromRow($row);
    }

    /** $email must already be normalized (see normalizeEmail). */
    public function findByEmail(string $email): ?User
    {
        $row = $this->db->fetchOne('SELECT ' . self::COLUMNS . ' FROM users WHERE email = :email', ['email' => $email]);

        return $row === null ? null : User::fromRow($row);
    }

    public function create(string $email, string $passwordHash, string $displayName): User
    {
        $id = $this->db->insert(
            'INSERT INTO users (public_id, email, password_hash, display_name)
             VALUES (:public_id, :email, :password_hash, :display_name)',
            [
                'public_id' => Ulid::generate(),
                'email' => $email,
                'password_hash' => $passwordHash,
                'display_name' => $displayName,
            ],
        );

        return $this->findById($id) ?? throw new \RuntimeException('User not found after insert.');
    }

    /** Silent rehash on login (algorithm upgrade). Does not sign out other sessions. */
    public function updatePasswordHash(int $userId, string $passwordHash): void
    {
        $this->db->execute('UPDATE users SET password_hash = :hash WHERE id = :id', ['hash' => $passwordHash, 'id' => $userId]);
    }

    /** Password change by the user: new hash AND auth_version + 1 (invalidates every other session). */
    public function changePassword(int $userId, string $passwordHash): void
    {
        $this->db->execute(
            'UPDATE users SET password_hash = :hash, auth_version = auth_version + 1 WHERE id = :id',
            ['hash' => $passwordHash, 'id' => $userId],
        );
    }

    public function updateProfile(int $userId, string $displayName, string $email): void
    {
        $this->db->execute(
            'UPDATE users SET display_name = :name, email = :email WHERE id = :id',
            ['name' => $displayName, 'email' => $email, 'id' => $userId],
        );
    }

    public function updateLocale(int $userId, string $locale): void
    {
        $this->db->execute('UPDATE users SET locale = :locale WHERE id = :id', ['locale' => $locale, 'id' => $userId]);
    }

    /** Hard delete. Cascades: owned projects, memberships, subscription. Payments keep user_id = NULL. */
    public function delete(int $userId): void
    {
        $this->db->execute('DELETE FROM users WHERE id = :id', ['id' => $userId]);
    }

    public function touchLastLogin(int $userId): void
    {
        $this->db->execute('UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = :id', ['id' => $userId]);
    }

    public static function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
