<?php

// Minimaler SMTP-Server für PhpMailerTransportTest. Aufruf: php fake_smtp_server.php <port|0> <ausgabedatei> [fail-auth|trickle]
// Port 0: das Betriebssystem vergibt den Port (kein Wettlauf zwischen Prüfen und Binden). Gemeldet wird "ready <port>"
// erst, wenn der Server wirklich lauscht; scheitert das Binden, steht der Fehler auf STDERR und der Exit-Code ist 2.
[, $port, $out] = $argv;
$failAuth = ($argv[3] ?? '') === 'fail-auth';
$srv = @stream_socket_server("tcp://127.0.0.1:$port", $e, $s);
if ($srv === false) {
    fwrite(STDERR, "bind fehlgeschlagen: $s ($e)\n");
    exit(2);
}
$bound = (int) substr(strrchr((string) stream_socket_get_name($srv, false), ':'), 1);
fwrite(STDOUT, "ready $bound\n");
// Ergebnis erst in eine Hilfsdatei, dann umbenennen: der Leser sieht nie eine halbe Datei.
$write = static function (string $json) use ($out): void {
    file_put_contents($out . '.tmp', $json);
    rename($out . '.tmp', $out);
};
$c = stream_socket_accept($srv, 10);
$log = [];
$send = function (string $l) use ($c): void { fwrite($c, $l . "\r\n"); };
if (($argv[3] ?? '') === 'trickle') {
    for ($i = 0; $i < 40; $i++) {
        if (@fwrite($c, "220-trickle\r\n") === false) { break; }
        usleep(250_000);
    }
    $write(json_encode(['log' => [], 'message' => '']));
    exit;
}
$send('220 fake ESMTP');
$data = false;
$msg = '';
while (($line = fgets($c)) !== false) {
    if ($data) {
        if ($line === ".\r\n") { $data = false; $log[] = 'DATA-END'; $send('250 queued'); continue; }
        $msg .= $line;
        continue;
    }
    $log[] = rtrim($line, "\r\n");
    $cmd = strtoupper(substr($line, 0, 4));
    if ($cmd === 'EHLO') { fwrite($c, "250-fake\r\n250 AUTH LOGIN\r\n"); }
    elseif ($cmd === 'AUTH') { $send('334 VXNlcm5hbWU6'); }
    elseif (count($log) >= 2 && str_starts_with(end($log), 'AUTH') === false && in_array('AUTH LOGIN', $log, true) && !in_array('PASS', $log, true) && !isset($u)) { $u = 1; $send('334 UGFzc3dvcmQ6'); }
    elseif (isset($u) && !isset($p)) { $p = 1; $log[] = 'PASS'; $send($failAuth ? '535 denied' : '235 ok'); if ($failAuth) { break; } }
    elseif ($cmd === 'MAIL' || $cmd === 'RCPT') { $send('250 ok'); }
    elseif ($cmd === 'DATA') { $data = true; $send('354 go'); }
    elseif ($cmd === 'QUIT') { $send('221 bye'); break; }
    else { $send('500 what'); }
}
$write(json_encode(['log' => $log, 'message' => $msg]));
