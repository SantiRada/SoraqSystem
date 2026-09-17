<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;
use Soraq\Modules\Account\AccountController;
use Soraq\Modules\Account\AccountService;
use Soraq\Modules\Auth\AuthModule;
use Soraq\Modules\Users\UserRepository;

/*
 * Account module — the authenticated user's OWN account. There are no ids in these
 * URLs on purpose: the target is always CurrentUser (no IDOR surface).
 *
 * PATCH  /account              auth   name + email (email change requires currentPassword)
 * POST   /account/password     auth   change password (signs out other sessions)
 * PATCH  /account/preferences  auth   locale
 * DELETE /account              auth   delete account (currentPassword + "ELIMINAR")
 */
return static function (Router $router, Services $services): void {
    $controller = static fn (): AccountController => new AccountController(
        new AccountService(
            new UserRepository($services->db()),
            AuthModule::authSession($services),
            $services->passwords(),
            $services->rateLimiter(),
            $services->audit(),
            $services,
        ),
        $services->csrf(),
        $services->config->get('app.supported_locales', ['es']),
    );

    $router->group([AuthModule::requireAuth($services)], static function (Router $router) use ($controller): void {
        $router->patch('/account', static fn (Request $r) => $controller()->updateProfile($r));
        $router->post('/account/password', static fn (Request $r) => $controller()->changePassword($r));
        $router->patch('/account/preferences', static fn (Request $r) => $controller()->updatePreferences($r));
        $router->delete('/account', static fn (Request $r) => $controller()->delete($r));
    });
};
