-- Card Sorting studies (Planear → Navegación → Arquitectura → Card Sorting). docs/modules/card-sorting.md
-- content / settings are JSON documents validated by CardSortContent (never trusted from the client as-is).
CREATE TABLE card_sorts (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    public_id           CHAR(26)        NOT NULL,
    project_id          BIGINT UNSIGNED NOT NULL,
    created_by_user_id  BIGINT UNSIGNED NULL,
    name                VARCHAR(120)    NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'draft',   -- draft | active | paused | closed
    sort_type           VARCHAR(20)     NOT NULL DEFAULT 'open',    -- open | hybrid | closed
    content             MEDIUMTEXT      NOT NULL,
    settings            TEXT            NOT NULL,
    share_code          VARCHAR(16)     NULL,                       -- generated on first publish
    project_slug        VARCHAR(80)     NULL,                       -- frozen on first publish
    published_at        DATETIME        NULL,
    closed_at           DATETIME        NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_card_sorts_public_id (public_id),
    UNIQUE KEY uq_card_sorts_share_code (share_code),
    KEY idx_card_sorts_project (project_id, updated_at),
    CONSTRAINT fk_card_sorts_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_sorts_creator FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anonymous participant sessions. No IP, user agent or personal data is stored.
-- token_hash = sha256 of the secret token given to the participant's browser.
-- snapshot = the study version the participant saw (cards, categories, questions), so later edits never alter results.
CREATE TABLE card_sort_responses (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    card_sort_id        BIGINT UNSIGNED NOT NULL,
    token_hash          CHAR(64)        NOT NULL,
    participant_number  INT UNSIGNED    NULL,                       -- assigned when finished
    status              VARCHAR(20)     NOT NULL DEFAULT 'in_progress', -- in_progress | completed | screened_out
    screening_passed    TINYINT(1)      NOT NULL DEFAULT 0,
    snapshot            MEDIUMTEXT      NOT NULL,
    screening_answers   TEXT            NULL,
    post_answers        TEXT            NULL,
    sort_result         MEDIUMTEXT      NULL,
    started_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at         DATETIME        NULL,
    duration_seconds    INT UNSIGNED    NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_card_sort_responses_token (token_hash),
    KEY idx_card_sort_responses_study (card_sort_id, status),
    CONSTRAINT fk_card_sort_responses_study FOREIGN KEY (card_sort_id) REFERENCES card_sorts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Designers with read-only ("VIEW") access to one study, without access to the project.
CREATE TABLE card_sort_viewers (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    card_sort_id        BIGINT UNSIGNED NOT NULL,
    user_id             BIGINT UNSIGNED NOT NULL,
    added_by_user_id    BIGINT UNSIGNED NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_card_sort_viewers (card_sort_id, user_id),
    KEY idx_card_sort_viewers_user (user_id),
    CONSTRAINT fk_card_sort_viewers_study FOREIGN KEY (card_sort_id) REFERENCES card_sorts (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_sort_viewers_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_card_sort_viewers_added_by FOREIGN KEY (added_by_user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
