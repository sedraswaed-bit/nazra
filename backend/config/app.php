<?php

return [
    'name' => env('APP_NAME', 'NAZRA'),
    'env' => env('APP_ENV', 'local'),
    'debug' => (bool) env('APP_DEBUG', true),
    'url' => env('APP_URL', 'http://localhost:8000'),
    'key' => env('APP_KEY', 'base64:YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY='),
    'cipher' => 'AES-256-CBC',
    'timezone' => 'Asia/Damascus',
    'locale' => 'ar',
    'fallback_locale' => 'en',
    'faker_locale' => 'ar_SA',
    'aliases' => Illuminate\Support\Facades\Facade::defaultAliases()->merge([
        // Additional aliases
    ])->toArray(),
];