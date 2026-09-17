<?php

declare(strict_types=1);

namespace Soraq\Core\Http;

/**
 * JSON API response.
 *
 * Envelope contract (see docs/ARCHITECTURE.md → API):
 *   success: { "data": ... }
 *   error:   { "error": { "code", "message", "fields"?, "requestId" } }
 */
final class Response
{
    /** @param array<string, string> $headers */
    private function __construct(
        public readonly int $status,
        private array $headers,
        private readonly string $body,
    ) {
    }

    public static function json(mixed $data, int $status = 200): self
    {
        return new self($status, [], self::encode(['data' => $data]));
    }

    /** @param array<string, mixed> $error */
    public static function error(int $status, array $error): self
    {
        return new self($status, [], self::encode(['error' => $error]));
    }

    public static function noContent(): self
    {
        return new self(204, [], '');
    }

    public function withHeader(string $name, string $value): self
    {
        $clone = clone $this;
        $clone->headers[$name] = $value;

        return $clone;
    }

    public function send(string $requestId, bool $isHttps): void
    {
        if (headers_sent()) {
            return;
        }

        header_remove('X-Powered-By');
        http_response_code($this->status);

        $defaults = [
            'Content-Type' => 'application/json; charset=utf-8',
            'Cache-Control' => 'no-store',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'no-referrer',
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'",
            'Cross-Origin-Resource-Policy' => 'same-origin',
            'X-Request-Id' => $requestId,
        ];

        if ($isHttps) {
            $defaults['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
        }

        foreach (array_merge($defaults, $this->headers) as $name => $value) {
            header($name . ': ' . $value);
        }

        if ($this->status !== 204) {
            echo $this->body;
        }
    }

    private static function encode(mixed $payload): string
    {
        return json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}
