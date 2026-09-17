-- Spanish is the product's native language (docs/decisions/0008).
ALTER TABLE users
    ALTER COLUMN locale SET DEFAULT 'es';

-- Pre-release data only: no production users exist for this schema yet.
UPDATE users SET locale = 'es' WHERE locale = 'en';
