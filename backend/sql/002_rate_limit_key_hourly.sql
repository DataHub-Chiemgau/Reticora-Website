-- MariaDB. Idempotent. Spec Ä-36 (DS-03): Rate-Limit-Schlüssel je Stundenfenster statt je UTC-Tag.
-- Für Datenbanken, die mit der ersten Fassung von 001_init.sql (Spalte "day") angelegt wurden. Der alte Schlüssel ist danach
-- ungültig (window_start = 0) und wird beim nächsten Aufruf neu erzeugt; die Zähler des laufenden Fensters beginnen von vorn.
ALTER TABLE rate_limit_key ADD COLUMN IF NOT EXISTS window_start INT UNSIGNED NOT NULL DEFAULT 0 AFTER id;
ALTER TABLE rate_limit_key DROP COLUMN IF EXISTS day;
