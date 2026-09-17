<?php

declare(strict_types=1);

namespace Soraq\Core\I18n;

/**
 * Translates user-facing API messages from backend/lang/<locale>/<file>.php.
 *
 * Keys: "<file>.<key>" (e.g. "errors.not_found"). Params: ":name" placeholders.
 * The locale is negotiated per request from Accept-Language among the supported
 * locales (config/app.php). Missing keys fall back to the default locale, then to the key.
 */
final class Translator
{
    /** @var array<string, array<string, array<string, string>>> locale => file => messages */
    private array $loaded = [];

    public function __construct(
        private readonly string $langPath,
        private readonly string $locale,
        private readonly string $fallbackLocale,
    ) {
    }

    /** @param list<string> $supported */
    public static function negotiate(?string $acceptLanguage, array $supported, string $default): string
    {
        if ($acceptLanguage === null || $acceptLanguage === '') {
            return $default;
        }

        // "es-AR,es;q=0.9,en;q=0.8" → ordered candidates by quality.
        $candidates = [];
        foreach (explode(',', $acceptLanguage) as $index => $part) {
            [$tag, $quality] = array_pad(explode(';q=', trim($part)), 2, '1');
            $candidates[] = [strtolower(trim($tag)), (float) $quality, $index];
        }
        usort($candidates, static fn (array $a, array $b): int => [$b[1], $a[2]] <=> [$a[1], $b[2]]);

        foreach ($candidates as [$tag]) {
            foreach ([$tag, explode('-', $tag)[0]] as $option) {
                if (in_array($option, $supported, true)) {
                    return $option;
                }
            }
        }

        return $default;
    }

    public function locale(): string
    {
        return $this->locale;
    }

    /** @param array<string, scalar> $params */
    public function get(string $key, array $params = []): string
    {
        $message = $this->find($this->locale, $key) ?? $this->find($this->fallbackLocale, $key) ?? $key;

        foreach ($params as $name => $value) {
            $message = str_replace(':' . $name, (string) $value, $message);
        }

        return $message;
    }

    private function find(string $locale, string $key): ?string
    {
        [$file, $item] = array_pad(explode('.', $key, 2), 2, '');

        if (!preg_match('/^[a-z_]+$/', $file) || !preg_match('/^[a-z]{2}(-[a-z]{2})?$/', $locale)) {
            return null;
        }

        if (!isset($this->loaded[$locale][$file])) {
            $path = $this->langPath . '/' . $locale . '/' . $file . '.php';
            $this->loaded[$locale][$file] = is_file($path) ? require $path : [];
        }

        $message = $this->loaded[$locale][$file][$item] ?? null;

        return is_string($message) ? $message : null;
    }
}
