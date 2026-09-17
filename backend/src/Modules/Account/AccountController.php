<?php

declare(strict_types=1);

namespace Soraq\Modules\Account;

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Security\Csrf;
use Soraq\Modules\Auth\CurrentUser;

final class AccountController
{
    /** @param list<string> $supportedLocales */
    public function __construct(
        private readonly AccountService $service,
        private readonly Csrf $csrf,
        private readonly array $supportedLocales,
    ) {
    }

    public function updateProfile(Request $request): Response
    {
        $user = $this->service->updateProfile(CurrentUser::from($request), $request->json(), $request);

        return Response::json(['user' => $user->toPublicArray()]);
    }

    /** Returns a NEW CSRF token: the session was regenerated. */
    public function changePassword(Request $request): Response
    {
        $user = $this->service->changePassword(CurrentUser::from($request), $request->json(), $request);

        return Response::json(['user' => $user->toPublicArray(), 'csrfToken' => $this->csrf->token()]);
    }

    public function updatePreferences(Request $request): Response
    {
        $user = $this->service->updatePreferences(CurrentUser::from($request), $request->json(), $this->supportedLocales, $request);

        return Response::json(['user' => $user->toPublicArray()]);
    }

    public function delete(Request $request): Response
    {
        $this->service->deleteAccount(CurrentUser::from($request), $request->json(), $request);

        return Response::json(['user' => null, 'csrfToken' => $this->csrf->token()]);
    }
}
