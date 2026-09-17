<?php

declare(strict_types=1);

namespace Soraq\Modules\Auth;

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Security\Csrf;

/**
 * HTTP adapter for authentication. Parses requests, delegates to AuthService,
 * shapes responses. No business rules here.
 */
final class AuthController
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly AuthSession $authSession,
        private readonly Csrf $csrf,
    ) {
    }

    /** GET /auth/session — current user (or null) + CSRF token for the SPA. */
    public function session(Request $request): Response
    {
        return Response::json([
            'user' => $this->authSession->user()?->toPublicArray(),
            'csrfToken' => $this->csrf->token(),
        ]);
    }

    public function register(Request $request): Response
    {
        $user = $this->auth->register($request->json(), $request);

        return Response::json(['user' => $user->toPublicArray(), 'csrfToken' => $this->csrf->token()], 201);
    }

    public function login(Request $request): Response
    {
        $user = $this->auth->login($request->json(), $request);

        return Response::json(['user' => $user->toPublicArray(), 'csrfToken' => $this->csrf->token()]);
    }

    public function logout(Request $request): Response
    {
        $this->auth->logout($request);

        return Response::json(['user' => null, 'csrfToken' => $this->csrf->token()]);
    }
}
