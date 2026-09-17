<?php

declare(strict_types=1);

namespace Soraq\Core\Security;

use Soraq\Core\Database\Database;
use Soraq\Core\Http\HttpException;

/**
 * Fixed-window rate limiter backed by the `rate_limits` table.
 * Keys are hashed, so emails/IPs are not stored in clear text in this table.
 */
final class RateLimiter
{
    public function __construct(private readonly Database $db)
    {
    }

    /**
     * Registers one attempt and throws 429 when the limit is exceeded.
     *
     * @param array{0: int, 1: int} $limit [max attempts, window seconds]
     */
    public function hit(string $key, array $limit): void
    {
        [$maxAttempts, $windowSeconds] = $limit;
        $hash = hash('sha256', $key);

        // Assignments run left to right: `attempts` is computed with the OLD reset_at.
        $this->db->execute(
            'INSERT INTO rate_limits (key_hash, attempts, reset_at)
             VALUES (:key_hash, 1, UTC_TIMESTAMP() + INTERVAL :window SECOND)
             ON DUPLICATE KEY UPDATE
               attempts = IF(reset_at <= UTC_TIMESTAMP(), 1, attempts + 1),
               reset_at = IF(reset_at <= UTC_TIMESTAMP(), UTC_TIMESTAMP() + INTERVAL :window2 SECOND, reset_at)',
            ['key_hash' => $hash, 'window' => $windowSeconds, 'window2' => $windowSeconds],
        );

        $row = $this->db->fetchOne(
            'SELECT attempts, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), reset_at) AS retry_after
             FROM rate_limits WHERE key_hash = :key_hash',
            ['key_hash' => $hash],
        );

        if ($row !== null && (int) $row['attempts'] > $maxAttempts) {
            throw HttpException::tooManyRequests((int) $row['retry_after']);
        }
    }

    public function clear(string $key): void
    {
        $this->db->execute('DELETE FROM rate_limits WHERE key_hash = :key_hash', ['key_hash' => hash('sha256', $key)]);
    }
}
