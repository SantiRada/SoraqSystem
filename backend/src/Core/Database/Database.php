<?php

declare(strict_types=1);

namespace Soraq\Core\Database;

use PDO;
use Throwable;

/**
 * Thin PDO wrapper. The ONLY way modules talk to MySQL.
 *
 * Rules (docs/SECURITY_AUDIT.md → Database):
 * - Always prepared statements with bound parameters. Never concatenate input into SQL.
 * - Only repositories (src/Modules/<Module>/*Repository.php) use this class.
 * - Connection is lazy: endpoints that do not need the DB never open one.
 */
final class Database
{
    private ?PDO $pdo = null;

    /** @param array{host: string, port: int, database: string, username: string, password: string, charset: string} $config */
    public function __construct(private readonly array $config)
    {
    }

    /**
     * @param array<string, scalar|null> $params
     * @return array<string, mixed>|null
     */
    public function fetchOne(string $sql, array $params = []): ?array
    {
        $statement = $this->pdo()->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();

        return $row === false ? null : $row;
    }

    /**
     * @param array<string, scalar|null> $params
     * @return list<array<string, mixed>>
     */
    public function fetchAll(string $sql, array $params = []): array
    {
        $statement = $this->pdo()->prepare($sql);
        $statement->execute($params);

        return $statement->fetchAll();
    }

    /**
     * @param array<string, scalar|null> $params
     * @return int affected rows
     */
    public function execute(string $sql, array $params = []): int
    {
        $statement = $this->pdo()->prepare($sql);
        $statement->execute($params);

        return $statement->rowCount();
    }

    /** @param array<string, scalar|null> $params */
    public function insert(string $sql, array $params = []): int
    {
        $this->execute($sql, $params);

        return (int) $this->pdo()->lastInsertId();
    }

    /**
     * @template T
     * @param callable(self): T $callback
     * @return T
     */
    public function transaction(callable $callback): mixed
    {
        $pdo = $this->pdo();
        $pdo->beginTransaction();

        try {
            $result = $callback($this);
            $pdo->commit();

            return $result;
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
    }

    /** For CLI tooling (migrations) only. */
    public function pdo(): PDO
    {
        if ($this->pdo !== null) {
            return $this->pdo;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $this->config['host'],
            $this->config['port'],
            $this->config['database'],
            $this->config['charset'],
        );

        $this->pdo = new PDO($dsn, $this->config['username'], $this->config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);

        // All timestamps are UTC; strict mode rejects silently truncated data.
        $this->pdo->exec("SET time_zone = '+00:00', SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'");

        return $this->pdo;
    }
}
