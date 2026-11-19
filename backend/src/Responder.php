<?php

declare(strict_types=1);

namespace Reticora\Lead;

/** Einzige Stelle, die wirklich ausgibt (header(), echo). */
final class Responder
{
    public static function emit(Response $response): void
    {
        if (!headers_sent()) {
            header_remove('X-Powered-By'); // S-05: auch wenn der Hoster expose_php = On hat
            http_response_code($response->status);
            foreach ($response->headers as $name => $value) {
                header($name . ': ' . $value);
            }
        }
        echo $response->body;
    }
}
