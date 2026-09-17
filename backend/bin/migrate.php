<?php

declare(strict_types=1);

/*
 * Database migration runner (CLI only).
 *
 *   php bin/migrate.php            apply pending migrations
 *   php bin/migrate.php --status   list applied / pending migrations
 *
 * Migrations are forward-only .sql files in database/migrations, applied in
 * filename order. Never edit a migration that has run anywhere — add a new one.
 * One SQL statement per `;` at end of line.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require dirname(__DIR__) . '/src/autoload.php';

use Soraq\Core\Config\Config;
use Soraq\Core\Database\Database;

$root = dirname(__DIR__);
$config = Config::load($root);
$pdo = (new Database($config->get('database')))->pdo();

$pdo->exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(191) NOT NULL PRIMARY KEY,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);

$applied = $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
$files = glob($root . '/database/migrations/*.sql') ?: [];
sort($files);

$statusOnly = in_array('--status', $argv, true);
$pending = 0;

foreach ($files as $file) {
    $version = basename($file, '.sql');

    if (in_array($version, $applied, true)) {
        $statusOnly && fwrite(STDOUT, "  [applied] {$version}\n");
        continue;
    }

    $pending++;

    if ($statusOnly) {
        fwrite(STDOUT, "  [pending] {$version}\n");
        continue;
    }

    $sql = preg_replace('/^\s*--.*$/m', '', (string) file_get_contents($file));
    $statements = array_filter(array_map('trim', preg_split('/;\s*$/m', (string) $sql) ?: []));

    try {
        foreach ($statements as $statement) {
            $pdo->exec($statement);
        }
        $insert = $pdo->prepare('INSERT INTO schema_migrations (version) VALUES (:version)');
        $insert->execute(['version' => $version]);
        fwrite(STDOUT, "  [done]    {$version}\n");
    } catch (Throwable $error) {
        fwrite(STDERR, "  [failed]  {$version}: {$error->getMessage()}\n");
        fwrite(STDERR, "MySQL DDL is not transactional: inspect the database before retrying.\n");
        exit(1);
    }
}

fwrite(STDOUT, $pending === 0 ? "Nothing to migrate.\n" : ($statusOnly ? "{$pending} pending.\n" : "Migrated {$pending}.\n"));
