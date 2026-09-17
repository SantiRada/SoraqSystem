<?php

declare(strict_types=1);

namespace Soraq\Modules\Auth;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Middleware;
use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Modules\Users\User;

/**
 * Route middleware: rejects anonymous requests with 401 and exposes the
 * authenticated user to handlers via CurrentUser::from($request).
 */
final class RequireAuth implements Middleware
{
    public const ATTRIBUTE = 'auth.user';

    public function __construct(private readonly AuthSession $authSession)
    {
    }

    public function handle(Request $request, callable $next): Response
    {
        $user = $this->authSession->user();

        if (!$user instanceof User) {
            throw HttpException::unauthenticated();
        }

        $request->setAttribute(self::ATTRIBUTE, $user);

        return $next($request);
    }
}
