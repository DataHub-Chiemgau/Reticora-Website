<?php

declare(strict_types=1);

namespace Reticora\Lead;

/** Einzige Stelle, die wirklich ausgibt (header(), echo). */
final class Responder
{
    public static function emit(Response $response): void
    {
        if (!headers_sent()) {
            http_response_code($response->status);
            foreach ($response->headers as $name => $value) {
                header($name . ': ' . $value);
            }
        }
        echo $response->body;
    }
}
