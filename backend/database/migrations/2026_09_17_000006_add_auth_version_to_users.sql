-- Session invalidation counter. Every authenticated session stores the value it was
-- created with; incrementing it (password change) signs out all other sessions.
ALTER TABLE users
    ADD COLUMN auth_version INT UNSIGNED NOT NULL DEFAULT 1 AFTER role;
