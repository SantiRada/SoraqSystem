<?php

declare(strict_types=1);

namespace Soraq\Modules\Auth;

use Soraq\Core\Security\Csrf;
use Soraq\Core\Security\SessionManager;
use Soraq\Modules\Users\User;
use Soraq\Modules\Users\UserRepository;

/**
 * Binds an authenticated user to the session.
 * The session stores ONLY the internal user id; the user is reloaded from the
 * database on each request so suspended/deleted accounts lose access immediately.
 * The session also stores users.auth_version: a password change increments it and
 * every other session is signed out on its next request.
 */
final class AuthSession
{
    private const USER_KEY = '_auth_user_id';
    private const VERSION_KEY = '_auth_version';

    private ?User $resolved = null;
    private bool $isResolved = false;

    public function __construct(
        private readonly SessionManager $session,
        private readonly Csrf $csrf,
        private readonly UserRepository $users,
    ) {
    }

    public function user(): ?User
    {
        if ($this->isResolved) {
            return $this->resolved;
        }

        $this->isResolved = true;
        $userId = $this->session->get(self::USER_KEY);

        if (!is_int($userId)) {
            return null;
        }

        $user = $this->users->findById($userId);

        if ($user === null || !$user->isActive() || $this->session->get(self::VERSION_KEY) !== $user->authVersion) {
            $this->end();

            return null;
        }

        return $this->resolved = $user;
    }

    /** Session ID and CSRF token are rotated on every privilege change. */
    public function begin(User $user): void
    {
        $this->session->regenerate();
        $this->session->set(self::USER_KEY, $user->id);
        $this->session->set(self::VERSION_KEY, $user->authVersion);
        $this->csrf->rotate();
        $this->resolved = $user;
        $this->isResolved = true;
    }

    /** Clears the cached user so the next user() call reloads it (after profile changes). */
    public function forget(): void
    {
        $this->resolved = null;
        $this->isResolved = false;
    }

    public function end(): void
    {
        $this->session->invalidate();
        $this->csrf->rotate();
        $this->resolved = null;
        $this->isResolved = true;
    }
}
