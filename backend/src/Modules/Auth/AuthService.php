<?php

declare(strict_types=1);

namespace Soraq\Modules\Auth;

use Soraq\Core\Audit\AuditLogger;
use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Request;
use Soraq\Core\Security\PasswordHasher;
use Soraq\Core\Security\RateLimiter;
use Soraq\Core\Services;
use Soraq\Core\Validation\Validator;
use Soraq\Modules\Users\User;
use Soraq\Modules\Users\UserRepository;

/**
 * Authentication business logic (no HTTP formatting here).
 */
final class AuthService
{
    public const PASSWORD_MIN = 12;
    public const PASSWORD_MAX = 256;

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
    public function register(array $input, Request $request): User
    {
        $this->rateLimiter->hit('register:ip:' . $request->ip, $this->services->rateLimit('register_per_ip'));

        $data = Validator::validate($input, [
            'displayName' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:254'],
            'password' => ['required', 'string', 'min:' . self::PASSWORD_MIN, 'max:' . self::PASSWORD_MAX],
        ], noTrim: ['password']);

        $email = UserRepository::normalizeEmail($data['email']);

        // Trade-off documented in SECURITY_AUDIT.md: explicit message (usability) mitigated by rate limiting.
        if ($this->users->findByEmail($email) !== null) {
            throw HttpException::validation(['email' => ['errors.email_taken']]);
        }

        $user = $this->users->create($email, $this->passwords->hash($data['password']), $data['displayName']);

        $this->authSession->begin($user);
        $this->users->touchLastLogin($user->id);
        $this->audit->record('auth.registered', $request, $user->id, 'user', $user->publicId);

        return $user;
    }

    /** @param array<string, mixed> $input */
    public function login(array $input, Request $request): User
    {
        $data = Validator::validate($input, [
            'email' => ['required', 'string', 'max:254'],
            'password' => ['required', 'string', 'max:' . self::PASSWORD_MAX],
        ], noTrim: ['password']);

        $email = UserRepository::normalizeEmail($data['email']);
        $accountKey = 'login:account-ip:' . $email . '|' . $request->ip;

        $this->rateLimiter->hit('login:ip:' . $request->ip, $this->services->rateLimit('login_per_ip'));
        $this->rateLimiter->hit($accountKey, $this->services->rateLimit('login_per_account_ip'));

        $user = $this->users->findByEmail($email);

        if ($user === null) {
            $this->passwords->verifyAgainstDummy($data['password']);
        }

        if ($user === null || !$this->passwords->verify($data['password'], $user->passwordHash) || !$user->isActive()) {
            $this->audit->record('auth.login_failed', $request, $user?->id, metadata: ['reason' => $user === null ? 'unknown_account' : 'rejected']);

            // Same response for unknown email, wrong password and inactive account (no enumeration).
            throw HttpException::invalidCredentials();
        }

        if ($this->passwords->needsRehash($user->passwordHash)) {
            $this->users->updatePasswordHash($user->id, $this->passwords->hash($data['password']));
        }

        $this->rateLimiter->clear($accountKey);
        $this->authSession->begin($user);
        $this->users->touchLastLogin($user->id);
        $this->audit->record('auth.login', $request, $user->id, 'user', $user->publicId);

        return $user;
    }

    public function logout(Request $request): void
    {
        $user = $this->authSession->user();

        if ($user !== null) {
            $this->audit->record('auth.logout', $request, $user->id, 'user', $user->publicId);
        }

        $this->authSession->end();
    }
}
