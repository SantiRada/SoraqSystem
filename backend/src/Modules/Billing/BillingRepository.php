<?php

declare(strict_types=1);

namespace Soraq\Modules\Billing;

use Soraq\Core\Database\Database;
use Soraq\Core\Support\DateFormat;

/**
 * Billing read model. All user queries are scoped by the internal user id of CurrentUser.
 * Writes (subscriptions, payments) will come from the payment provider integration.
 */
final class BillingRepository
{
    public const PAYMENTS_LIMIT = 24;

    public function __construct(private readonly Database $db)
    {
    }

    /** @return list<array<string, mixed>> */
    public function activePlans(): array
    {
        $rows = $this->db->fetchAll(
            'SELECT code, billing_interval, amount_minor, currency, requires_code FROM plans WHERE is_active = 1 ORDER BY sort_order',
        );

        return array_map(self::plan(...), $rows);
    }

    /** @return array<string, mixed>|null */
    public function subscriptionFor(int $userId): ?array
    {
        $row = $this->db->fetchOne(
            'SELECT s.status, s.current_period_start, s.current_period_end, s.cancel_at_period_end,
                    p.code, p.billing_interval, p.amount_minor, p.currency, p.requires_code
             FROM subscriptions s JOIN plans p ON p.id = s.plan_id
             WHERE s.user_id = :user',
            ['user' => $userId],
        );

        if ($row === null) {
            return null;
        }

        $renews = $row['status'] === 'active' && (int) $row['cancel_at_period_end'] === 0;

        return [
            'status' => (string) $row['status'],
            'plan' => self::plan($row),
            'currentPeriodStart' => DateFormat::toApi($row['current_period_start']),
            'currentPeriodEnd' => DateFormat::toApi($row['current_period_end']),
            'cancelAtPeriodEnd' => (int) $row['cancel_at_period_end'] === 1,
            // Next charge = end of the current period, only if it will renew.
            'nextPaymentAt' => $renews ? DateFormat::toApi($row['current_period_end']) : null,
            'nextPaymentAmountMinor' => $renews ? (int) $row['amount_minor'] : null,
        ];
    }

    /** @return list<array<string, mixed>> */
    public function paymentsFor(int $userId): array
    {
        $rows = $this->db->fetchAll(
            'SELECT pay.public_id, pay.amount_minor, pay.currency, pay.status, pay.paid_at, pay.created_at, p.code AS plan_code
             FROM payments pay LEFT JOIN plans p ON p.id = pay.plan_id
             WHERE pay.user_id = :user
             ORDER BY pay.created_at DESC
             LIMIT ' . self::PAYMENTS_LIMIT,
            ['user' => $userId],
        );

        return array_map(static fn (array $row): array => [
            'id' => (string) $row['public_id'],
            'planCode' => $row['plan_code'] !== null ? (string) $row['plan_code'] : null,
            'amountMinor' => (int) $row['amount_minor'],
            'currency' => (string) $row['currency'],
            'status' => (string) $row['status'],
            'paidAt' => DateFormat::toApi($row['paid_at']),
            'createdAt' => DateFormat::toApi($row['created_at']),
        ], $rows);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private static function plan(array $row): array
    {
        return [
            'code' => (string) $row['code'],
            'interval' => (string) $row['billing_interval'],
            'amountMinor' => (int) $row['amount_minor'],
            'currency' => (string) $row['currency'],
            'requiresCode' => (int) $row['requires_code'] === 1,
        ];
    }
}
