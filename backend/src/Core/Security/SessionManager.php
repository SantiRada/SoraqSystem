<?php

declare(strict_types=1);

namespace Soraq\Core\Security;

/**
 * Hardened native PHP session.
 *
 * - HttpOnly, SameSite=Lax, Secure + __Host- prefix over HTTPS.
 * - Strict mode (rejects uninitialised IDs → prevents session fixation).
 * - Idle and absolute timeouts enforced server-side.
 * - Session files stored in backend/storage/sessions (isolated from other apps).
 * - Lazy: a session is only started when a feature actually needs it.
 */
final class SessionManager
{
    private const CREATED_AT = '_created_at';
    private const LAST_ACTIVITY = '_last_activity';

    private bool $started = false;

    /**
     * @param array{cookie_name: string, secure: bool, same_site: string, idle_timeout: int, absolute_timeout: int} $config
     */
    public function __construct(
        private readonly array $config,
        private readonly string $savePath,
    ) {
    }

    public function start(): void
    {
        if ($this->started) {
            return;
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            ini_set('session.use_strict_mode', '1');
            ini_set('session.use_only_cookies', '1');
            ini_set('session.use_trans_sid', '0');
            ini_set('session.cookie_httponly', '1');
            ini_set('session.gc_maxlifetime', (string) $this->config['absolute_timeout']);
            session_cache_limiter('');

            if (is_dir($this->savePath) && is_writable($this->savePath)) {
                session_save_path($this->savePath);
            }

            session_name($this->config['cookie_name']);
            session_set_cookie_params([
                'lifetime' => $this->config['absolute_timeout'],
                'path' => '/',
                'domain' => '',
                'secure' => $this->config['secure'],
                'httponly' => true,
                'samesite' => $this->config['same_site'],
            ]);

            session_start();
        }

        $this->started = true;
        $this->enforceTimeouts();
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $this->start();

        return $_SESSION[$key] ?? $default;
    }

    public function set(string $key, mixed $value): void
    {
        $this->start();
        $_SESSION[$key] = $value;
    }

    public function remove(string $key): void
    {
        $this->start();
        unset($_SESSION[$key]);
    }

    /** Call on every privilege change (login, register, future role changes). */
    public function regenerate(): void
    {
        $this->start();
        session_regenerate_id(true);
        $_SESSION[self::CREATED_AT] = time();
    }

    /** Clears all data and issues a fresh session ID (logout, expiry). */
    public function invalidate(): void
    {
        $this->start();
        $_SESSION = [];
        session_regenerate_id(true);
        $_SESSION[self::CREATED_AT] = time();
        $_SESSION[self::LAST_ACTIVITY] = time();
    }

    private function enforceTimeouts(): void
    {
        $now = time();
        $createdAt = $_SESSION[self::CREATED_AT] ?? null;
        $lastActivity = $_SESSION[self::LAST_ACTIVITY] ?? null;

        if (!is_int($createdAt)) {
            $_SESSION[self::CREATED_AT] = $now;
        } elseif (
            $now - $createdAt > $this->config['absolute_timeout']
            || (is_int($lastActivity) && $now - $lastActivity > $this->config['idle_timeout'])
        ) {
            $this->invalidate();
        }

        $_SESSION[self::LAST_ACTIVITY] = $now;
    }
}
