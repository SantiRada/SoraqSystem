-- Tree Testing studies (Planear → Navegación → Arquitectura → Tree Testing). docs/modules/tree-testing.md
-- Same shape as card_sorts (ADR 0015 / 0016): validated JSON document + anonymous responses with a snapshot.
CREATE TABLE tree_tests (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id           CHAR(26)        NOT NULL,
    project_id          BIGINT UNSIGNED NOT NULL,
    created_by_user_id  BIGINT UNSIGNED NULL,
    name                VARCHAR(120)    NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'draft',   -- draft | active | paused | closed
    content             MEDIUMTEXT      NOT NULL,                   -- tree, tasks, flow
    settings            TEXT            NOT NULL,
    share_code          VARCHAR(16)     NULL,
    project_slug        VARCHAR(80)     NULL,
    published_at        DATETIME        NULL,
    closed_at           DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tree_tests_public_id (public_id),
    UNIQUE KEY uq_tree_tests_share_code (share_code),
    KEY idx_tree_tests_project (project_id, updated_at),
    CONSTRAINT fk_tree_tests_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_tree_tests_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- task_results: per task, the clicks (enter / back), the node nominated as the answer and the time taken.
CREATE TABLE tree_test_responses (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tree_test_id        BIGINT UNSIGNED NOT NULL,
    token_hash          CHAR(64)        NOT NULL,
    participant_number  INT UNSIGNED    NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'in_progress', -- in_progress | completed | screened_out
    screening_passed    TINYINT(1)      NOT NULL DEFAULT 0,
    snapshot            MEDIUMTEXT      NOT NULL,
    screening_answers   TEXT            NULL,
    post_answers        TEXT            NULL,
    task_results        MEDIUMTEXT      NULL,
    started_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at         DATETIME        NULL,
    duration_seconds    INT UNSIGNED    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tree_test_responses_token (token_hash),
    KEY idx_tree_test_responses_study (tree_test_id, status),
    CONSTRAINT fk_tree_test_responses_study FOREIGN KEY (tree_test_id) REFERENCES tree_tests (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tree_test_viewers (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tree_test_id        BIGINT UNSIGNED NOT NULL,
    user_id             BIGINT UNSIGNED NOT NULL,
    added_by_user_id    BIGINT UNSIGNED NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tree_test_viewers (tree_test_id, user_id),
    KEY idx_tree_test_viewers_user (user_id),
    CONSTRAINT fk_tree_test_viewers_study FOREIGN KEY (tree_test_id) REFERENCES tree_tests (id) ON DELETE CASCADE,
    CONSTRAINT fk_tree_test_viewers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_tree_test_viewers_added_by FOREIGN KEY (added_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
