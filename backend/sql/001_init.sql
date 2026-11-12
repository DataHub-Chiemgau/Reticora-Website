-- MariaDB 10.5+ (utf8mb4). Idempotent.
CREATE TABLE IF NOT EXISTS lead (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at  DATETIME NOT NULL,
    lang        CHAR(2) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    email       VARCHAR(254) NOT NULL,
    company     VARCHAR(200) NOT NULL,
    topic       VARCHAR(16) NOT NULL,
    message     TEXT NOT NULL,
    delivery    VARCHAR(24) NOT NULL DEFAULT 'pending',
    KEY idx_lead_created (created_at),
    KEY idx_lead_delivery (delivery)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit (
    hash          CHAR(64) NOT NULL,
    window_start  INT UNSIGNED NOT NULL,
    counter       INT UNSIGNED NOT NULL,
    PRIMARY KEY (hash, window_start),
    KEY idx_rate_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;
