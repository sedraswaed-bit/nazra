<?php
// إعدادات الجلسات / Session Configuration

use Illuminate\Support\Str;

return [

    /*
    |----------------------------------------------------------------------
    | سائق الجلسة الافتراضي / Default Session Driver
    |----------------------------------------------------------------------
    */

    'driver' => env('SESSION_DRIVER', 'file'),

    /*
    |----------------------------------------------------------------------
    | عمر الجلسة / Session Lifetime
    |----------------------------------------------------------------------
    */

    'lifetime' => env('SESSION_LIFETIME', 120),

    'expire_on_close' => env('SESSION_EXPIRE_ON_CLOSE', false),

    /*
    |----------------------------------------------------------------------
    | تشفير الجلسة / Session Encryption
    |----------------------------------------------------------------------
    */

    'encrypt' => env('SESSION_ENCRYPT', false),

    /*
    |----------------------------------------------------------------------
    | ملفات تعريف ارتباط الجلسة / Session Cookie
    |----------------------------------------------------------------------
    */

    'files' => storage_path('framework/sessions'),

    'connection' => env('SESSION_CONNECTION'),

    'table' => 'sessions',

    'lottery' => [2, 100],

    'cookie' => env(
        'SESSION_COOKIE',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_session'
    ),

    'path' => env('SESSION_PATH', '/'),

    'domain' => env('SESSION_DOMAIN'),

    'secure' => env('SESSION_SECURE_COOKIE'),

    'http_only' => env('SESSION_HTTP_ONLY', true),

    'same_site' => env('SESSION_SAME_SITE', 'lax'),

    'partitioned' => env('SESSION_PARTITIONED_COOKIE', false),

];
