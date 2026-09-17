<?php

declare(strict_types=1);

namespace Soraq\Core;

use ErrorException;
use Soraq\Core\Config\Config;
use Soraq\Core\Errors\ErrorHandler;
use Soraq\Core\Http\Middleware\VerifyCsrf;
use Soraq\Core\Http\Middleware\VerifyOrigin;
use Soraq\Core\Http\Request;
use Soraq\Core\Http\Router;
use Soraq\Core\I18n\Translator;
use Throwable;

/**
 * Request lifecycle: Request → global middleware → module routes → Response.
 */
final class Application
{
    public function __construct(
        private readonly Config $config,
        private readonly string $root,
    ) {
        date_default_timezone_set('UTC');
        ini_set('display_errors', '0');
        ini_set('expose_php', '0');

        // Warnings/notices become exceptions: they are bugs, not noise.
        set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
            if (!(error_reporting() & $severity)) {
                return false;
            }
            throw new ErrorException($message, 0, $severity, $file, $line);
        });
    }

    public function run(): void
    {
        $locale = Translator::negotiate(
            $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? null,
            $this->config->get('app.supported_locales', ['es']),
            (string) $this->config->get('app.locale', 'es'),
        );
        $services = new Services($this->config, $this->root, $locale);
        $errors = new ErrorHandler($services->logger(), $services->translator(), (bool) $this->config->get('app.debug'));
        $requestId = bin2hex(random_bytes(8));

        try {
            $request = Request::fromGlobals((int) $this->config->get('app.max_body_bytes'));
            $requestId = $request->id;
            $response = $this->buildRouter($services)->dispatch($request);
        } catch (Throwable $error) {
            $response = $errors->render($error, $requestId);
        }

        $isHttps = ($_SERVER['HTTPS'] ?? '') !== '' && ($_SERVER['HTTPS'] ?? '') !== 'off';
        $response->withHeader('Content-Language', $locale)->send($requestId, $isHttps);
    }

    private function buildRouter(Services $services): Router
    {
        $router = new Router([
            new VerifyOrigin($this->config->get('app.allowed_origins')),
            new VerifyCsrf($services->csrf()),
        ]);

        foreach ($this->config->get('modules', []) as $module) {
            $register = require $this->root . '/src/Modules/' . $module . '/routes.php';
            $register($router, $services);
        }

        return $router;
    }
}
