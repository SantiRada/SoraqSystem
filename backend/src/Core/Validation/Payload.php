<?php

declare(strict_types=1);

namespace Soraq\Core\Validation;

use Soraq\Core\Http\HttpException;

/**
 * Strict reader for nested JSON documents (study content, participant submissions).
 * Collects every error with a dotted field path (e.g. "cards.3.label") and throws one 422 at the end.
 * Only values read through it end up in the normalised output, so unknown keys are dropped.
 */
final class Payload
{
    /** @var array<string, array{0: string, 1?: array<string, scalar>}> */
    private array $errors = [];

    public function string(mixed $value, string $field, int $max, bool $required = true): string
    {
        if ($value === null || (is_string($value) && trim($value) === '')) {
            if ($required) {
                $this->fail($field, 'validation.required');
            }

            return '';
        }
        if (!is_string($value)) {
            $this->fail($field, 'validation.string');

            return '';
        }
        $value = trim($value);
        if (mb_strlen($value) > $max) {
            $this->fail($field, 'validation.max', ['max' => $max]);

            return mb_substr($value, 0, $max);
        }

        return $value;
    }

    public function bool(mixed $value): bool
    {
        return $value === true;
    }

    public function int(mixed $value, string $field, int $min, int $max, int $default): int
    {
        if (!is_int($value)) {
            if ($value !== null) {
                $this->fail($field, 'validation.invalid');
            }

            return $default;
        }
        if ($value < $min || $value > $max) {
            $this->fail($field, 'validation.between', ['min' => $min, 'max' => $max]);

            return $default;
        }

        return $value;
    }

    /** @param list<string> $allowed */
    public function enum(mixed $value, string $field, array $allowed, string $default): string
    {
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            $this->fail($field, 'validation.in');

            return $default;
        }

        return $value;
    }

    /**
     * A JSON array of objects, capped.
     *
     * @return list<array<string, mixed>>
     */
    public function objects(mixed $value, string $field, int $max): array
    {
        if ($value === null) {
            return [];
        }
        if (!is_array($value) || !array_is_list($value)) {
            $this->fail($field, 'validation.invalid');

            return [];
        }
        if (count($value) > $max) {
            $this->fail($field, 'validation.too_many', ['max' => $max]);
            $value = array_slice($value, 0, $max);
        }

        $out = [];
        foreach ($value as $index => $item) {
            if (!is_array($item) || array_is_list($item) && $item !== []) {
                $this->fail($field . '.' . $index, 'validation.invalid');
                continue;
            }
            $out[] = $item;
        }

        return $out;
    }

    /** @return array<string, mixed> */
    public function object(mixed $value, string $field): array
    {
        if ($value === null) {
            return [];
        }
        if (!is_array($value) || (array_is_list($value) && $value !== [])) {
            $this->fail($field, 'validation.invalid');

            return [];
        }

        return $value;
    }

    /** Client-generated stable id of an item inside a document (card, category, question, option, step). */
    public function id(mixed $value, string $field): string
    {
        if (!is_string($value) || !preg_match('/^[A-Za-z0-9_-]{1,36}$/', $value)) {
            $this->fail($field, 'validation.invalid');

            return bin2hex(random_bytes(6));
        }

        return $value;
    }

    /**
     * @param list<array{id: string}> $items
     */
    public function uniqueIds(array $items, string $field): void
    {
        $ids = array_column($items, 'id');
        if (count($ids) !== count(array_unique($ids))) {
            $this->fail($field, 'validation.duplicate');
        }
    }

    /** @param array<string, scalar> $params */
    public function fail(string $field, string $key, array $params = []): void
    {
        // Keep the first error per field: it is usually the root cause.
        $this->errors[$field] ??= $params === [] ? [$key] : [$key, $params];
    }

    public function hasErrors(): bool
    {
        return $this->errors !== [];
    }

    public function throwIfInvalid(): void
    {
        if ($this->errors !== []) {
            throw HttpException::validation(array_slice($this->errors, 0, 50, true));
        }
    }
}
