<?php

declare(strict_types=1);

use Soraq\Core\Config\Env;

// Safe defaults: an unconfigured environment behaves like production.
$env = Env::get('APP_ENV', 'production');
$url = Env::get('APP_URL', 'https://soraq.app');
$origins = Env::list('APP_ALLOWED_ORIGINS');

return [
    'name' => 'Soraq',
    'env' => $env,
    // Debug output is never allowed in production, whatever the .env says.
    'debug' => $env !== 'production' && Env::bool('APP_DEBUG'),
    'url' => $url,
    'allowed_origins' => $origins !== [] ? $origins : [rtrim((string) $url, '/')],
    // All dates are stored and processed in UTC. Localisation happens in the client.
    'timezone' => 'UTC',
    // API message language: negotiated from Accept-Language among these (backend/lang/<code>/).
    'locale' => Env::get('APP_LOCALE', 'es'),
    'supported_locales' => ['es'],
    'max_body_bytes' => Env::int('HTTP_MAX_BODY_BYTES', 1048576),
];
