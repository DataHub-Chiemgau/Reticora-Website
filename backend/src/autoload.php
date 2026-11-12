<?php

declare(strict_types=1);

// Minimaler PSR-4-Autoloader: Reticora\Lead\Foo -> src/Foo.php. Im Betrieb ist kein Composer nötig.
spl_autoload_register(static function (string $class): void {
    $prefix = 'Reticora\\Lead\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $relative = substr($class, strlen($prefix));
    $file = __DIR__ . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) {
        require $file;
    }
});
