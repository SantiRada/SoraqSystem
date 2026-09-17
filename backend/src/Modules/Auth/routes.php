<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;
use Soraq\Modules\Auth\AuthController;
use Soraq\Modules\Auth\AuthModule;
use Soraq\Modules\Auth\AuthService;
use Soraq\Modules\Users\UserRepository;

/*
 * Auth module endpoints. CSRF + Origin checks are applied globally by the router.
 *
 * GET  /auth/session   public   current user or null + CSRF token
 * POST /auth/register  public   rate limited
 * POST /auth/login     public   rate limited
 * POST /auth/logout    public   (no-op for anonymous sessions)
 */
return static function (Router $router, Services $services): void {
    $controller = static function () use ($services): AuthController {
        $authSession = AuthModule::authSession($services);

        return new AuthController(
            new AuthService(
                new UserRepository($services->db()),
                $authSession,
                $services->passwords(),
                $services->rateLimiter(),
                $services->audit(),
                $services,
            ),
            $authSession,
            $services->csrf(),
        );
    };

    $router->get('/auth/session', static fn (Request $r) => $controller()->session($r));
    $router->post('/auth/register', static fn (Request $r) => $controller()->register($r));
    $router->post('/auth/login', static fn (Request $r) => $controller()->login($r));
    $router->post('/auth/logout', static fn (Request $r) => $controller()->logout($r));
};
