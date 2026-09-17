-- Users: identity + authentication. One row per person.
-- email is stored normalized (trimmed, lower-case).
-- locale/timezone are user preferences for the client; the backend always works in UTC.
CREATE TABLE users (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id       CHAR(26)        NOT NULL,
    email           VARCHAR(254)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    display_name    VARCHAR(100)    NOT NULL,
    locale          VARCHAR(35)     NOT NULL DEFAULT 'en',
    timezone        VARCHAR(64)     NOT NULL DEFAULT 'UTC',
    status          VARCHAR(20)     NOT NULL DEFAULT 'active',
    last_login_at   DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_public_id (public_id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
