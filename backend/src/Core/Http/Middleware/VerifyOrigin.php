<?php

declare(strict_types=1);

namespace Soraq\Core\Http\Middleware;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Middleware;
use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;

/**
 * Rejects state-changing requests coming from origins that are not Soraq.
 * Defense in depth on top of CSRF tokens and SameSite cookies.
 */
final class VerifyOrigin implements Middleware
{
    /** @param list<string> $allowedOrigins */
    public function __construct(private readonly array $allowedOrigins)
    {
    }

    public function handle(Request $request, callable $next): Response
    {
        if ($request->isUnsafeMethod()) {
            $origin = $request->header('origin');

            if ($origin !== null && !in_array(rtrim($origin, '/'), $this->allowedOrigins, true)) {
                throw HttpException::forbidden('origin_not_allowed', 'errors.origin_not_allowed');
            }
        }

        return $next($request);
    }
}
