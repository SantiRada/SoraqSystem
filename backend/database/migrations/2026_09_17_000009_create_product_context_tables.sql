-- Product notes ("Investigación → Producto"): free-form notes that define the product
-- (Problemática, Objetivos, POV, MVP…). Deleted with the project.
CREATE TABLE product_notes (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id       CHAR(26)        NOT NULL,
    project_id      BIGINT UNSIGNED NOT NULL,
    author_user_id  BIGINT UNSIGNED NULL,
    title           VARCHAR(120)    NOT NULL,
    body            TEXT            NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_product_notes_public_id (public_id),
    KEY idx_product_notes_project (project_id, created_at),
    CONSTRAINT fk_product_notes_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_product_notes_author FOREIGN KEY (author_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Latest AI summary of a project's notes ("Documentación → Context Prompt"). One row per project.
-- source_hash = fingerprint of the summarised notes, used to tell the user when the summary is outdated.
CREATE TABLE project_context_prompts (
    project_id            BIGINT UNSIGNED NOT NULL,
    summary               MEDIUMTEXT      NOT NULL,
    source_hash           CHAR(64)        NOT NULL,
    note_count            INT UNSIGNED    NOT NULL,
    model                 VARCHAR(100)    NOT NULL,
    generated_by_user_id  BIGINT UNSIGNED NULL,
    generated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id),
    CONSTRAINT fk_context_prompts_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_context_prompts_user FOREIGN KEY (generated_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
