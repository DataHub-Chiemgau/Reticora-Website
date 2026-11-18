<?php

declare(strict_types=1);

namespace Reticora\Lead;

/**
 * Protokolle als Tagesdateien (DS-04): Aus log_path ".../lead.log" wird ".../lead-JJJJ-MM-TT.log" (UTC). Die Cron-Ausgaben
 * von purge.php und retry.php liegen im selben Ordner als purge-JJJJ-MM-TT.log und retry-JJJJ-MM-TT.log (docs/deploy.md).
 * purge.php löscht Tagesdateien dieser drei Namen, die älter als retention_days sind; andere Dateien bleiben unberührt.
 */
final class LogFiles
{
    public const CRON_NAMES = ['purge', 'retry'];

    /** Pfad der Tagesdatei für log_path; leer bleibt leer (dann PHP-Fehlerprotokoll des Hosters). */
    public static function daily(string $logPath, int $now): string
    {
        if ($logPath === '') {
            return '';
        }
        return dirname($logPath) . '/' . self::base($logPath) . '-' . gmdate('Y-m-d', $now) . '.log';
    }

    /** Löscht Tagesdateien (Anwendung, purge, retry) im Ordner von log_path, deren Tag vor der Frist liegt. Liefert die Anzahl. */
    public static function purge(string $logPath, int $now, int $retentionDays): int
    {
        if ($logPath === '' || !is_dir(dirname($logPath))) {
            return 0;
        }
        $names = array_map(static fn (string $n): string => preg_quote($n, '/'), array_unique([self::base($logPath), ...self::CRON_NAMES]));
        $pattern = '/^(?:' . implode('|', $names) . ')-(\d{4}-\d{2}-\d{2})\.log$/';
        $cutoff = gmdate('Y-m-d', $now - $retentionDays * 86400);
        $deleted = 0;
        foreach (scandir(dirname($logPath)) ?: [] as $name) {
            if (preg_match($pattern, $name, $m) !== 1 || !self::isDate($m[1]) || $m[1] >= $cutoff) {
                continue;
            }
            $file = dirname($logPath) . '/' . $name;
            if (is_file($file) && !is_link($file) && @unlink($file)) {
                $deleted++;
            }
        }
        return $deleted;
    }

    private static function base(string $logPath): string
    {
        $name = basename($logPath);
        return str_ends_with($name, '.log') ? substr($name, 0, -4) : $name;
    }

    private static function isDate(string $ymd): bool
    {
        [$y, $m, $d] = array_map('intval', explode('-', $ymd));
        return checkdate($m, $d, $y);
    }
}
