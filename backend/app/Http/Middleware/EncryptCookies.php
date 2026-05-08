<?php
// وسيط تشفير الكوكيز - Encrypt Cookies Middleware
// منصة نظرة - NAZRA Platform

namespace App\Http\Middleware;

use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

class EncryptCookies extends Middleware
{
    protected $except = [
        //
    ];
}
