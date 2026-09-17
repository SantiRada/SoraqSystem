<?php

declare(strict_types=1);

namespace Soraq\Core\Http;

use JsonException;

/**
 * Immutable view of the incoming HTTP request (plus per-request attributes
 * set by middleware, e.g. the authenticated user).
 */
final class Request
{
    private const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

    /** @var array<string, mixed> */
    private array $attributes = [];

    /** @var array<string, mixed>|null */
    private ?array $decodedJson = null;

    /**
     * @param array<string, mixed>  $query
     * @param array<string, string> $headers lower-cased header names
     */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        private readonly array $query,
        private readonly array $headers,
        private readonly string $rawBody,
        public readonly string $ip,
        public readonly string $id,
    ) {
    }

    public static function fromGlobals(int $maxBodyBytes): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

        // Strip the folder that contains index.php (e.g. /api in production,
        // /SoraqSystem/backend/public locally) so routes are location-independent.
        $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
        if ($base !== '' && str_starts_with($uriPath, $base)) {
            $uriPath = substr($uriPath, strlen($base));
        }
        $path = '/' . trim(rawurldecode($uriPath), '/');

        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $headers[strtolower(str_replace('_', '-', substr($key, 5)))] = (string) $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }

        $body = '';
        if (in_array($method, self::UNSAFE_METHODS, true)) {
            $body = (string) file_get_contents('php://input', false, null, 0, $maxBodyBytes + 1);
            if (strlen($body) > $maxBodyBytes) {
                throw HttpException::payloadTooLarge();
            }
        }

        return new self(
            method: $method,
            path: $path,
            query: $_GET,
            headers: $headers,
            rawBody: $body,
            // REMOTE_ADDR only. Forwarded headers are spoofable and are not trusted
            // unless a trusted-proxy list is introduced (docs/SECURITY_AUDIT.md).
            ip: (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'),
            id: bin2hex(random_bytes(8)),
        );
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function query(string $name): ?string
    {
        $value = $this->query[$name] ?? null;

        return is_string($value) ? $value : null;
    }

    public function userAgent(): string
    {
        return mb_substr($this->header('user-agent') ?? '', 0, 255);
    }

    public function isUnsafeMethod(): bool
    {
        return in_array($this->method, self::UNSAFE_METHODS, true);
    }

    /**
     * Decoded JSON object body. Only application/json is accepted, which also
     * prevents classic cross-site form submissions.
     *
     * @return array<string, mixed>
     */
    public function json(): array
    {
        if ($this->decodedJson !== null) {
            return $this->decodedJson;
        }

        $contentType = strtolower($this->header('content-type') ?? '');
        if (!str_starts_with($contentType, 'application/json')) {
            throw HttpException::unsupportedMediaType();
        }

        try {
            $decoded = json_decode($this->rawBody === '' ? '{}' : $this->rawBody, true, 32, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw HttpException::badRequest('invalid_json', 'errors.invalid_json');
        }

        if (!is_array($decoded) || array_is_list($decoded) && $decoded !== []) {
            throw HttpException::badRequest('invalid_json', 'errors.json_object_required');
        }

        return $this->decodedJson = $decoded;
    }

    public function setAttribute(string $key, mixed $value): void
    {
        $this->attributes[$key] = $value;
    }

    public function attribute(string $key, mixed $default = null): mixed
    {
        return $this->attributes[$key] ?? $default;
    }
}
