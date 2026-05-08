<?php
// وسيط CSRF - CSRF Protection Middleware
// تعطيل CSRF لمسارات API - Disable CSRF for API routes
// منصة نظرة - NAZRA Platform

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    // المسارات المستثناة من CSRF - URIs excluded from CSRF verification
    protected $except = [
        'api/*',  // كل مسارات API - All API routes
    ];
}
