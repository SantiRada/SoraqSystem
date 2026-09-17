<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;

/*
 * Health module — liveness check for smoke tests after deployment.
 * Intentionally reveals nothing about versions, database or environment.
 */
return static function (Router $router, Services $services): void {
    $router->get('/health', static fn (Request $request): Response => Response::json(['status' => 'ok']));
};
