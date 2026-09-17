<?php

declare(strict_types=1);

use Soraq\Core\Config\Env;

$secure = Env::bool('SESSION_SECURE_COOKIE', Env::get('APP_ENV', 'production') === 'production');

return [
    // The __Host- prefix forces Secure + Path=/ + no Domain (only possible over HTTPS).
    'cookie_name' => $secure ? '__Host-soraq_sid' : 'soraq_sid',
    'secure' => $secure,
    'same_site' => 'Lax',
    'idle_timeout' => Env::int('SESSION_IDLE_TIMEOUT', 28800),
    'absolute_timeout' => Env::int('SESSION_ABSOLUTE_TIMEOUT', 604800),
];
