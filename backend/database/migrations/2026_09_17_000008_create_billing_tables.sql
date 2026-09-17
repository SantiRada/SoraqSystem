-- Billing read model (docs/decisions/0011). No payment provider is integrated yet:
-- rows are written by the future Billing provider webhooks (or dev seeders).
-- Money is always integer minor units + ISO 4217 currency.

CREATE TABLE plans (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code            VARCHAR(40)     NOT NULL,
    billing_interval VARCHAR(10)    NOT NULL,
    amount_minor    INT UNSIGNED    NOT NULL,
    currency        CHAR(3)         NOT NULL,
    requires_code   TINYINT(1)      NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_plans_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reference prices (docs/PRODUCT.md §8). Education requires a verified education code.
INSERT INTO plans (code, billing_interval, amount_minor, currency, requires_code, sort_order) VALUES
    ('standard', 'month', 4000, 'USD', 0, 1),
    ('annual', 'year', 36000, 'USD', 0, 2),
    ('education', 'month', 1200, 'USD', 1, 3);

-- One current subscription per user (history lives in payments).
CREATE TABLE subscriptions (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             BIGINT UNSIGNED NOT NULL,
    plan_id             BIGINT UNSIGNED NOT NULL,
    status              VARCHAR(20)     NOT NULL,
    current_period_start DATETIME       NOT NULL,
    current_period_end  DATETIME        NOT NULL,
    cancel_at_period_end TINYINT(1)     NOT NULL DEFAULT 0,
    provider            VARCHAR(20)     NULL,
    provider_reference  VARCHAR(191)    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_subscriptions_user (user_id),
    CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES plans (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment history. user_id is SET NULL on account deletion: accounting records are retained.
CREATE TABLE payments (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id           CHAR(26)        NOT NULL,
    user_id             BIGINT UNSIGNED NULL,
    plan_id             BIGINT UNSIGNED NULL,
    amount_minor        INT UNSIGNED    NOT NULL,
    currency            CHAR(3)         NOT NULL,
    status              VARCHAR(20)     NOT NULL,
    paid_at             DATETIME        NULL,
    provider            VARCHAR(20)     NULL,
    provider_reference  VARCHAR(191)    NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_payments_public_id (public_id),
    KEY idx_payments_user_created (user_id, created_at),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_payments_plan FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
