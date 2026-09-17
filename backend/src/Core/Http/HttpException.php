<?php

declare(strict_types=1);

namespace Soraq\Core\Http;

use RuntimeException;

/**
 * An error that is SAFE to show to the client.
 *
 * Messages are i18n KEYS (backend/lang/<locale>/*.php), translated by ErrorHandler
 * for the request locale. Anything that is not an HttpException becomes a generic 500.
 */
final class HttpException extends RuntimeException
{
    /**
     * @param array<string, scalar>                                     $params  message params
     * @param array<string, array{0: string, 1?: array<string, scalar>}> $fields  field => [messageKey, params]
     * @param array<string, string>                                     $headers extra response headers
     */
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        public readonly string $messageKey,
        public readonly array $params = [],
        public readonly array $fields = [],
        public readonly array $headers = [],
    ) {
        parent::__construct($errorCode, $status);
    }

    public static function badRequest(string $code, string $messageKey): self
    {
        return new self(400, $code, $messageKey);
    }

    public static function unauthenticated(): self
    {
        return new self(401, 'unauthenticated', 'errors.unauthenticated');
    }

    public static function invalidCredentials(): self
    {
        return new self(401, 'invalid_credentials', 'errors.invalid_credentials');
    }

    public static function forbidden(string $code = 'forbidden', string $messageKey = 'errors.forbidden'): self
    {
        return new self(403, $code, $messageKey);
    }

    /** Also used for resources that exist but belong to someone else (prevents enumeration). */
    public static function notFound(string $messageKey = 'errors.not_found'): self
    {
        return new self(404, 'not_found', $messageKey);
    }

    /** @param list<string> $allowed */
    public static function methodNotAllowed(array $allowed): self
    {
        return new self(405, 'method_not_allowed', 'errors.method_not_allowed', [], [], ['Allow' => implode(', ', $allowed)]);
    }

    public static function payloadTooLarge(): self
    {
        return new self(413, 'payload_too_large', 'errors.payload_too_large');
    }

    public static function unsupportedMediaType(): self
    {
        return new self(415, 'unsupported_media_type', 'errors.unsupported_media_type');
    }

    /** @param array<string, array{0: string, 1?: array<string, scalar>}> $fields */
    public static function validation(array $fields): self
    {
        return new self(422, 'validation_failed', 'errors.validation_failed', [], $fields);
    }

    public static function tooManyRequests(int $retryAfterSeconds): self
    {
        return new self(429, 'too_many_requests', 'errors.too_many_requests', [], [], ['Retry-After' => (string) max(1, $retryAfterSeconds)]);
    }
}
