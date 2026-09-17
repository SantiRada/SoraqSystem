<?php

declare(strict_types=1);

namespace Soraq\Core;

use Soraq\Core\Audit\AuditLogger;
use Soraq\Core\Config\Config;
use Soraq\Core\Database\Database;
use Soraq\Core\I18n\Translator;
use Soraq\Core\Logging\Logger;
use Soraq\Core\Security\Csrf;
use Soraq\Core\Security\PasswordHasher;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Security\SessionManager;

/**
 * Lazy factory for SHARED core services (one instance per request).
 *
 * Only cross-cutting infrastructure belongs here. Module classes
 * (controllers, services, repositories) are wired inside each module's routes.php,
 * so Core never depends on a feature module.
 */
final class Services
{
    private ?Database $db = null;
    private ?Logger $logger = null;
    private ?SessionManager $session = null;
    private ?Csrf $csrf = null;
    private ?RateLimiter $rateLimiter = null;
    private ?AuditLogger $audit = null;
    private ?PasswordHasher $passwords = null;
    private ?Translator $translator = null;

    /** @param string $locale request locale negotiated from Accept-Language */
    public function __construct(
        public readonly Config $config,
        public readonly string $root,
        public readonly string $locale,
    ) {
    }

    public function translator(): Translator
    {
        return $this->translator ??= new Translator($this->root . '/lang', $this->locale, (string) $this->config->get('app.locale', 'es'));
    }

    public function db(): Database
    {
        return $this->db ??= new Database($this->config->get('database'));
    }

    public function logger(): Logger
    {
        return $this->logger ??= new Logger($this->root . '/storage/logs');
    }

    public function session(): SessionManager
    {
        return $this->session ??= new SessionManager($this->config->get('session'), $this->root . '/storage/sessions');
    }

    public function csrf(): Csrf
    {
        return $this->csrf ??= new Csrf($this->session());
    }

    public function rateLimiter(): RateLimiter
    {
        return $this->rateLimiter ??= new RateLimiter($this->db());
    }

    public function audit(): AuditLogger
    {
        return $this->audit ??= new AuditLogger($this->db(), $this->logger());
    }

    public function passwords(): PasswordHasher
    {
        return $this->passwords ??= new PasswordHasher();
    }

    /** @return array{0: int, 1: int} */
    public function rateLimit(string $name): array
    {
        return $this->config->get('rate_limits.' . $name);
    }
}
