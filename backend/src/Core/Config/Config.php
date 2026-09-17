<?php

declare(strict_types=1);

namespace Soraq\Core\Config;

/**
 * Read-only configuration loaded from backend/config/*.php.
 * Access values with dot notation: $config->get('session.idle_timeout').
 */
final class Config
{
    /** @param array<string, mixed> $items */
    private function __construct(private readonly array $items)
    {
    }

    public static function load(string $root): self
    {
        Env::load($root . '/.env');

        $items = [];
        foreach (glob($root . '/config/*.php') ?: [] as $file) {
            $items[basename($file, '.php')] = require $file;
        }

        return new self($items);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $value = $this->items;

        foreach (explode('.', $key) as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }
            $value = $value[$segment];
        }

        return $value;
    }

    public function isProduction(): bool
    {
        return $this->get('app.env') === 'production';
    }
}
