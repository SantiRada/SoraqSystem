<?php

declare(strict_types=1);

namespace Soraq\Core\Security;

/**
 * Password hashing. Argon2id when available, bcrypt (PASSWORD_DEFAULT) otherwise.
 * Hashes are self-describing, so switching algorithms is handled by needsRehash().
 */
final class PasswordHasher
{
    public function hash(string $password): string
    {
        return password_hash($password, $this->algorithm());
    }

    public function verify(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    public function needsRehash(string $hash): bool
    {
        return password_needs_rehash($hash, $this->algorithm());
    }

    /**
     * Burns comparable CPU time when an account does not exist, so response
     * timing does not reveal which emails are registered.
     */
    public function verifyAgainstDummy(string $password): void
    {
        static $dummy = null;
        $dummy ??= password_hash('soraq-timing-equaliser', $this->algorithm());
        password_verify($password, $dummy);
    }

    private function algorithm(): string
    {
        return defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    }
}
