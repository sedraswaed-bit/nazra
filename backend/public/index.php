<?php
// ملف الدخول العام - Public index.php entry point
// منصة نظرة - NAZRA Platform

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// المحمل التلقائي - Autoloader
require __DIR__ . '/../vendor/autoload.php';

// تشغيل التطبيق - Run the application
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
);

$response->send();

$kernel->terminate($request, $response);
