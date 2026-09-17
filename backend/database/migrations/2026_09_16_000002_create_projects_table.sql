-- Projects: the root context of all UX work in Soraq.
-- Ownership is per user today. Future: workspace_id + membership roles
-- (see docs/DATABASE.md → Future entities). Deleting a user deletes their projects.
CREATE TABLE projects (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id       CHAR(26)        NOT NULL,
    owner_user_id   BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(120)    NOT NULL,
    description     VARCHAR(2000)   NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_projects_public_id (public_id),
    KEY idx_projects_owner_updated (owner_user_id, updated_at),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
