-- Platform role. 'user' (default) | 'admin'.
-- Admin grants access to platform administration features ONLY (future /admin endpoints).
-- It never bypasses project ownership: admins cannot read other users' projects (docs/decisions/0009).
ALTER TABLE users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER status;
