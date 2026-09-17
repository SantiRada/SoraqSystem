<?php

declare(strict_types=1);

namespace Soraq\Core\Support;

/**
 * API date contract: ISO 8601 in UTC ("2026-09-16T21:04:00Z").
 * The database stores UTC DATETIMEs; the client formats per user locale/timezone.
 */
final class DateFormat
{
    public static function toApi(?string $utcDateTime): ?string
    {
        if ($utcDateTime === null) {
            return null;
        }

        return str_replace(' ', 'T', substr($utcDateTime, 0, 19)) . 'Z';
    }
}
