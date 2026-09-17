<?php

declare(strict_types=1);

namespace Soraq\Modules\Auth;

use Soraq\Core\Services;
use Soraq\Modules\Users\UserRepository;

/**
 * Public factory of the Auth module. Other modules obtain the auth middleware
 * here instead of constructing Auth internals themselves.
 */
final class AuthModule
{
    private static ?AuthSession $authSession = null;

    public static function authSession(Services $services): AuthSession
    {
        return self::$authSession ??= new AuthSession(
            $services->session(),
            $services->csrf(),
            new UserRepository($services->db()),
        );
    }

    public static function requireAuth(Services $services): RequireAuth
    {
        return new RequireAuth(self::authSession($services));
    }

    /** Use AFTER requireAuth: `$router->group([AuthModule::requireAuth($s), AuthModule::requireAdmin()], …)`. */
    public static function requireAdmin(): RequireAdmin
    {
        return new RequireAdmin();
    }
}
