<?php

declare(strict_types=1);

/*
 * Creates or updates the LOCAL debug account (development only).
 *
 *   php bin/seed-debug-user.php
 *
 *   Name: Debug · Email: debug@debug.com · Password: debug1234 · Role: admin
 *   Billing (sample data): active Standard subscription + 3 paid monthly payments.
 *
 * ⚠ The password is intentionally weak and bypasses the registration policy.
 *   This script refuses to run unless APP_ENV=development, and the account must
 *   never exist in staging/production (checked in docs/DEPLOYMENT.md).
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require dirname(__DIR__) . '/src/autoload.php';

use Soraq\Core\Config\Config;
use Soraq\Core\Database\Database;
use Soraq\Core\Security\PasswordHasher;
use Soraq\Core\Support\Ulid;

const DEBUG_NAME = 'Debug';
const DEBUG_EMAIL = 'debug@debug.com';
const DEBUG_PASSWORD = 'debug1234';

$config = Config::load(dirname(__DIR__));

if ($config->get('app.env') !== 'development') {
    fwrite(STDERR, "Refusing to run: APP_ENV must be 'development'.\n");
    exit(1);
}

$db = new Database($config->get('database'));
$hash = (new PasswordHasher())->hash(DEBUG_PASSWORD);

$existing = $db->fetchOne('SELECT id FROM users WHERE email = :email', ['email' => DEBUG_EMAIL]);

if ($existing !== null) {
    $userId = (int) $existing['id'];
    $db->execute(
        "UPDATE users SET display_name = :name, password_hash = :hash, role = 'admin', status = 'active' WHERE id = :id",
        ['name' => DEBUG_NAME, 'hash' => $hash, 'id' => $userId],
    );
    fwrite(STDOUT, 'Debug user updated (' . DEBUG_EMAIL . ", role admin).\n");
} else {
    $userId = $db->insert(
        "INSERT INTO users (public_id, email, password_hash, display_name, role) VALUES (:public_id, :email, :hash, :name, 'admin')",
        ['public_id' => Ulid::generate(), 'email' => DEBUG_EMAIL, 'hash' => $hash, 'name' => DEBUG_NAME],
    );
    fwrite(STDOUT, 'Debug user created (' . DEBUG_EMAIL . ", role admin).\n");
}

// Sample billing data (only if the account has none).
$plan = $db->fetchOne("SELECT id, amount_minor, currency FROM plans WHERE code = 'standard'");
$hasSubscription = $db->fetchOne('SELECT 1 FROM subscriptions WHERE user_id = :user', ['user' => $userId]) !== null;

if ($plan !== null && !$hasSubscription) {
    $db->execute(
        "INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end, provider)
         VALUES (:user, :plan, 'active', UTC_TIMESTAMP() - INTERVAL 10 DAY, UTC_TIMESTAMP() + INTERVAL 20 DAY, 'dev-seed')",
        ['user' => $userId, 'plan' => (int) $plan['id']],
    );

    foreach ([10, 40, 70] as $daysAgo) {
        $db->insert(
            "INSERT INTO payments (public_id, user_id, plan_id, amount_minor, currency, status, paid_at, provider, created_at)
             VALUES (:public_id, :user, :plan, :amount, :currency, 'paid',
                     UTC_TIMESTAMP() - INTERVAL :days1 DAY, 'dev-seed', UTC_TIMESTAMP() - INTERVAL :days2 DAY)",
            [
                'public_id' => Ulid::generate(),
                'user' => $userId,
                'plan' => (int) $plan['id'],
                'amount' => (int) $plan['amount_minor'],
                'currency' => (string) $plan['currency'],
                'days1' => $daysAgo,
                'days2' => $daysAgo,
            ],
        );
    }
    fwrite(STDOUT, "Sample billing data created (Standard, 3 payments).\n");
}
