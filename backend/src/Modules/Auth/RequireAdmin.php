<?php

declare(strict_types=1);

namespace Soraq\Modules\Auth;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Middleware;
use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;

/**
 * Route middleware for platform administration endpoints (none exist yet).
 * Must run after RequireAuth. Non-admins get 404 so admin endpoints are not discoverable.
 * Admin access is audited by the endpoints themselves ("admin.*" actions).
 */
final class RequireAdmin implements Middleware
{
    public function handle(Request $request, callable $next): Response
    {
        if (!CurrentUser::from($request)->isAdmin()) {
            throw HttpException::notFound('errors.endpoint_not_found');
        }

        return $next($request);
    }
}
