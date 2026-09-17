<?php

declare(strict_types=1);

/*
 * PSR-4 autoloader for the Soraq\ namespace → src/.
 * Kept dependency-free so deployment to shared hosting does not require
 * Composer. If Composer is introduced later, replace this with vendor/autoload.php
 * (see docs/ARCHITECTURE.md → "Dependencies").
 */
spl_autoload_register(static function (string $class): void {
    $prefix = 'Soraq\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';

    if (is_file($file)) {
        require $file;
    }
});
