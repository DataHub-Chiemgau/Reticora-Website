-- SQLite (nur Tests und lokale E2E-Läufe). Gleiche Spalten wie 001_init.sql.
CREATE TABLE IF NOT EXISTS lead (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT NOT NULL,
    lang        TEXT NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    company     TEXT NOT NULL,
    topic       TEXT NOT NULL,
    message     TEXT NOT NULL,
    delivery    TEXT NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS idx_lead_created ON lead (created_at);

CREATE TABLE IF NOT EXISTS rate_limit (
    hash          TEXT NOT NULL,
    window_start  INTEGER NOT NULL,
    counter       INTEGER NOT NULL,
    PRIMARY KEY (hash, window_start)
);

CREATE TABLE IF NOT EXISTS rate_limit_key (
    id      INTEGER NOT NULL PRIMARY KEY,
    day     TEXT NOT NULL,
    secret  TEXT NOT NULL
);
