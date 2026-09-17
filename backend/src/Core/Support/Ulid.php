<?php

declare(strict_types=1);

namespace Soraq\Core\Support;

/**
 * ULID generator (26 chars, Crockford base32, time-sortable, 80 random bits).
 *
 * Every entity exposed through the API uses a ULID `public_id`.
 * Auto-increment `id`s are internal and must never appear in URLs or responses
 * (non-guessable IDs are defense in depth; authorization is still mandatory).
 */
final class Ulid
{
    private const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    private const PATTERN = '/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/';

    public static function generate(): string
    {
        $time = (int) floor(microtime(true) * 1000);
        $timePart = '';
        for ($i = 0; $i < 10; $i++) {
            $timePart = self::ALPHABET[$time % 32] . $timePart;
            $time = intdiv($time, 32);
        }

        $randomPart = '';
        $buffer = 0;
        $bits = 0;
        foreach (str_split(random_bytes(10)) as $byte) {
            $buffer = ($buffer << 8) | ord($byte);
            $bits += 8;
            while ($bits >= 5) {
                $bits -= 5;
                $randomPart .= self::ALPHABET[($buffer >> $bits) & 31];
            }
            $buffer &= (1 << $bits) - 1;
        }

        return $timePart . $randomPart;
    }

    public static function isValid(string $value): bool
    {
        return preg_match(self::PATTERN, $value) === 1;
    }
}
