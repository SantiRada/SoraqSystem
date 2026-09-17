<?php

declare(strict_types=1);

namespace Soraq\Core\Logging;

/**
 * Technical log (JSON lines) in storage/logs/. Not the audit log.
 * Sensitive keys are redacted before writing. Never log request bodies wholesale.
 */
final class Logger
{
    private const REDACTED_KEYS = ['password', 'password_hash', 'token', 'csrf', 'secret', 'authorization', 'cookie'];

    public function __construct(private readonly string $directory)
    {
    }

    /** @param array<string, mixed> $context */
    public function error(string $message, array $context = []): void
    {
        $this->write('error', $message, $context);
    }

    /** @param array<string, mixed> $context */
    public function warning(string $message, array $context = []): void
    {
        $this->write('warning', $message, $context);
    }

    /** @param array<string, mixed> $context */
    public function info(string $message, array $context = []): void
    {
        $this->write('info', $message, $context);
    }

    /** @param array<string, mixed> $context */
    private function write(string $level, string $message, array $context): void
    {
        $line = json_encode([
            'time' => gmdate('Y-m-d\TH:i:s\Z'),
            'level' => $level,
            'message' => $message,
            'context' => $this->redact($context),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);

        $file = $this->directory . '/app-' . gmdate('Y-m-d') . '.log';

        if (@file_put_contents($file, $line . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
            error_log('[soraq] ' . $line);
        }
    }

    /**
     * @param array<string, mixed> $context
     * @return array<string, mixed>
     */
    private function redact(array $context): array
    {
        foreach ($context as $key => $value) {
            foreach (self::REDACTED_KEYS as $sensitive) {
                if (str_contains(strtolower((string) $key), $sensitive)) {
                    $context[$key] = '[redacted]';
                    continue 2;
                }
            }
            if (is_array($value)) {
                $context[$key] = $this->redact($value);
            }
        }

        return $context;
    }
}
