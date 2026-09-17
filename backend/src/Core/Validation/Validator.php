<?php

declare(strict_types=1);

namespace Soraq\Core\Validation;

use Soraq\Core\Http\HttpException;

/**
 * Declarative input validation. Returns ONLY the declared fields (unknown input is dropped,
 * which prevents mass-assignment), with strings trimmed.
 *
 * Rules: required | nullable | string | email | min:N | max:N (N = characters) | in:a,b,c
 * Errors are i18n keys from lang/<locale>/validation.php, translated by ErrorHandler.
 *
 * Usage:
 *   $data = Validator::validate($request->json(), [
 *       'name' => ['required', 'string', 'max:120'],
 *   ]);
 */
final class Validator
{
    /**
     * @param array<string, mixed>        $input
     * @param array<string, list<string>> $rules
     * @param list<string>                $noTrim fields whose value must not be trimmed (passwords)
     * @return array<string, mixed>
     */
    public static function validate(array $input, array $rules, array $noTrim = []): array
    {
        $clean = [];
        $errors = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $input[$field] ?? null;

            if (is_string($value) && !in_array($field, $noTrim, true)) {
                $value = trim($value);
            }

            if ($value === null || $value === '') {
                if (in_array('required', $fieldRules, true)) {
                    $errors[$field] = ['validation.required'];
                } else {
                    $clean[$field] = null;
                }
                continue;
            }

            $error = self::check($value, $fieldRules);
            if ($error !== null) {
                $errors[$field] = $error;
                continue;
            }

            $clean[$field] = $value;
        }

        if ($errors !== []) {
            throw HttpException::validation($errors);
        }

        return $clean;
    }

    /**
     * @param list<string> $rules
     * @return array{0: string, 1?: array<string, scalar>}|null
     */
    private static function check(mixed $value, array $rules): ?array
    {
        foreach ($rules as $rule) {
            [$name, $argument] = array_pad(explode(':', $rule, 2), 2, null);

            $error = match ($name) {
                'string' => is_string($value) ? null : ['validation.string'],
                'email' => is_string($value) && filter_var($value, FILTER_VALIDATE_EMAIL) !== false ? null : ['validation.email'],
                'min' => is_string($value) && mb_strlen($value) < (int) $argument ? ['validation.min', ['min' => (int) $argument]] : null,
                'max' => is_string($value) && mb_strlen($value) > (int) $argument ? ['validation.max', ['max' => (int) $argument]] : null,
                'in' => in_array($value, explode(',', (string) $argument), true) ? null : ['validation.in'],
                default => null,
            };

            if ($error !== null) {
                return $error;
            }
        }

        return null;
    }
}
