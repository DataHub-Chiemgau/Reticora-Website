<?php

// Minimaler SMTP-Server für SmtpTransportTest. Aufruf: php fake_smtp_server.php <port> <ausgabedatei> [auth-fehler]
[, $port, $out] = $argv;
$failAuth = ($argv[3] ?? '') === 'fail-auth';
$srv = stream_socket_server("tcp://127.0.0.1:$port", $e, $s);
fwrite(STDOUT, "ready\n");
$c = stream_socket_accept($srv, 10);
$log = [];
$send = function (string $l) use ($c): void { fwrite($c, $l . "\r\n"); };
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
file_put_contents($out, json_encode(['log' => $log, 'message' => $msg]));
