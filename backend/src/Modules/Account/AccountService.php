<?php

declare(strict_types=1);

namespace Soraq\Modules\Account;

use Soraq\Core\Audit\AuditLogger;
use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\Security\PasswordHasher;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Services;
use Soraq\Core\Validation\Validator;
use Soraq\Modules\Auth\AuthService;
use Soraq\Modules\Auth\AuthSession;
use Soraq\Modules\Users\User;
use Soraq\Modules\Users\UserRepository;

/**
 * Self-service account management for the AUTHENTICATED user only.
 * Every sensitive change (email, password, deletion) requires the current password (re-authentication).
 */
final class AccountService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly AuthSession $authSession,
        private readonly PasswordHasher $passwords,
        private readonly RateLimiter $rateLimiter,
        private readonly AuditLogger $audit,
        private readonly Services $services,
    ) {
    }

    /** @param array<string, mixed> $input */
    public function updateProfile(User $user, array $input, Request $request): User
    {
        $this->rateLimiter->hit('account:update:user:' . $user->id, $this->services->rateLimit('account_update_per_user'));

        $data = Validator::validate($input, [
            'displayName' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:254'],
            'currentPassword' => ['nullable', 'string', 'max:' . AuthService::PASSWORD_MAX],
        ], noTrim: ['currentPassword']);

        $email = UserRepository::normalizeEmail($data['email']);
        $emailChanged = $email !== $user->email;

        if ($emailChanged) {
            $this->assertCurrentPassword($user, $data['currentPassword']);

            $existing = $this->users->findByEmail($email);
            if ($existing !== null && $existing->id !== $user->id) {
                throw HttpException::validation(['email' => ['errors.email_taken']]);
            }
        }

        $this->users->updateProfile($user->id, $data['displayName'], $email);

        $this->audit->record(
            $emailChanged ? 'account.email_changed' : 'account.profile_updated',
            $request,
            $user->id,
            'user',
            $user->publicId,
        );

        return $this->reload($user);
    }

    /** @param array<string, mixed> $input */
    public function changePassword(User $user, array $input, Request $request): User
    {
        $this->rateLimiter->hit('account:password:user:' . $user->id, $this->services->rateLimit('account_password_per_user'));

        $data = Validator::validate($input, [
            'currentPassword' => ['required', 'string', 'max:' . AuthService::PASSWORD_MAX],
            'newPassword' => ['required', 'string', 'min:' . AuthService::PASSWORD_MIN, 'max:' . AuthService::PASSWORD_MAX],
        ], noTrim: ['currentPassword', 'newPassword']);

        $this->assertCurrentPassword($user, $data['currentPassword']);

        if ($this->passwords->verify($data['newPassword'], $user->passwordHash)) {
            throw HttpException::validation(['newPassword' => ['errors.password_same_as_current']]);
        }

        // Increments auth_version: every OTHER session is signed out on its next request.
        $this->users->changePassword($user->id, $this->passwords->hash($data['newPassword']));
        $updated = $this->reload($user);

        // Keep THIS session: new session id + CSRF token bound to the new auth_version.
        $this->authSession->begin($updated);
        $this->audit->record('account.password_changed', $request, $user->id, 'user', $user->publicId);

        return $updated;
    }

    /**
     * @param array<string, mixed> $input
     * @param list<string>         $supportedLocales
     */
    public function updatePreferences(User $user, array $input, array $supportedLocales, Request $request): User
    {
        $data = Validator::validate($input, [
            'locale' => ['required', 'string', 'in:' . implode(',', $supportedLocales)],
        ]);

        $this->users->updateLocale($user->id, $data['locale']);
        $this->audit->record('account.preferences_updated', $request, $user->id, 'user', $user->publicId, ['locale' => $data['locale']]);

        return $this->reload($user);
    }

    /** @param array<string, mixed> $input */
    public function deleteAccount(User $user, array $input, Request $request): void
    {
        $this->rateLimiter->hit('account:delete:user:' . $user->id, $this->services->rateLimit('account_delete_per_user'));

        $data = Validator::validate($input, [
            'currentPassword' => ['required', 'string', 'max:' . AuthService::PASSWORD_MAX],
            'confirmation' => ['required', 'string', 'max:20'],
        ], noTrim: ['currentPassword']);

        $this->assertCurrentPassword($user, $data['currentPassword']);

        if ($data['confirmation'] !== 'ELIMINAR') {
            throw HttpException::validation(['confirmation' => ['errors.account_delete_confirmation']]);
        }

        // Audit BEFORE deleting (actor id is kept in audit_logs, which has no FK to users).
        $this->audit->record('account.deleted', $request, $user->id, 'user', $user->publicId);
        $this->users->delete($user->id);
        $this->authSession->end();
    }

    private function assertCurrentPassword(User $user, ?string $password): void
    {
        if ($password === null || !$this->passwords->verify($password, $user->passwordHash)) {
            throw HttpException::validation(['currentPassword' => ['errors.current_password_incorrect']]);
        }
    }

    private function reload(User $user): User
    {
        $this->authSession->forget();

        return $this->users->findById($user->id) ?? throw HttpException::unauthenticated();
    }
}
