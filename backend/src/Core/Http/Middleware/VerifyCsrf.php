<?php

declare(strict_types=1);

namespace Soraq\Core\Http\Middleware;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Middleware;
use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Security\Csrf;

/**
 * Applied globally: every POST/PUT/PATCH/DELETE needs a valid X-CSRF-Token.
 * Secure by default — there is intentionally no per-route opt-out.
 * A future public endpoint without a session (e.g. study participants) must
 * document its alternative protection in docs/SECURITY_AUDIT.md first.
 */
final class VerifyCsrf implements Middleware
{
    public function __construct(private readonly Csrf $csrf)
    {
    }

    public function handle(Request $request, callable $next): Response
    {
        if ($request->isUnsafeMethod() && !$this->csrf->isValid($request->header('x-csrf-token'))) {
            throw HttpException::forbidden('csrf_invalid', 'errors.csrf_invalid');
        }

        return $next($request);
    }
}
