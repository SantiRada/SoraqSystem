<?php

declare(strict_types=1);

namespace Soraq\Core\Security;

/**
 * Synchronizer-token CSRF protection.
 * The token lives in the session and is sent by the SPA in the X-CSRF-Token header
 * on every state-changing request. It is rotated on login/logout.
 */
final class Csrf
{
    private const SESSION_KEY = '_csrf_token';

    public function __construct(private readonly SessionManager $session)
    {
    }

    public function token(): string
    {
        $token = $this->session->get(self::SESSION_KEY);

        if (!is_string($token) || $token === '') {
            $token = $this->rotate();
        }

        return $token;
    }

    public function rotate(): string
    {
        $token = bin2hex(random_bytes(32));
        $this->session->set(self::SESSION_KEY, $token);

        return $token;
    }

    public function isValid(?string $candidate): bool
    {
        $token = $this->session->get(self::SESSION_KEY);

        return is_string($token) && $token !== '' && is_string($candidate) && hash_equals($token, $candidate);
    }
}
