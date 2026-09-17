-- Audit log: append-only record of security-relevant actions.
-- No foreign key on actor_user_id on purpose: the trail must survive user deletion.
-- Retention policy: docs/SECURITY_AUDIT.md → Audit log.
CREATE TABLE audit_logs (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    occurred_at     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    actor_user_id   BIGINT UNSIGNED NULL,
    action          VARCHAR(64)     NOT NULL,
    target_type     VARCHAR(40)     NULL,
    target_id       VARCHAR(64)     NULL,
    ip_address      VARCHAR(45)     NULL,
    user_agent      VARCHAR(255)    NULL,
    request_id      CHAR(16)        NULL,
    metadata        TEXT            NULL,
    PRIMARY KEY (id),
    KEY idx_audit_logs_actor (actor_user_id, occurred_at),
    KEY idx_audit_logs_action (action, occurred_at),
    KEY idx_audit_logs_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limiting counters (fixed window). key_hash = sha256 of the limiter key.
CREATE TABLE rate_limits (
    key_hash        CHAR(64)        NOT NULL,
    attempts        INT UNSIGNED    NOT NULL,
    reset_at        DATETIME        NOT NULL,
    PRIMARY KEY (key_hash),
    KEY idx_rate_limits_reset (reset_at)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COLLATE=ascii_bin;
