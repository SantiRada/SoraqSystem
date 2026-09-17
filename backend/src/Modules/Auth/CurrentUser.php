<?php

declare(strict_types=1);

namespace Soraq\Modules\Auth;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Modules\Users\User;

/**
 * The public contract other modules use to know WHO is making the request.
 * Never read user ids from the request body, query string or URL.
 */
final class CurrentUser
{
    public static function from(Request $request): User
    {
        $user = $request->attribute(RequireAuth::ATTRIBUTE);

        if (!$user instanceof User) {
            // Route is missing RequireAuth: fail closed.
            throw HttpException::unauthenticated();
        }

        return $user;
    }
}
