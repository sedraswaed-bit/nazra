<?php
// مسارات الويب - Web Routes
// منصة نظرة - NAZRA Platform

use Illuminate\Support\Facades\Route;

// الصفحة الرئيسية - Home page
Route::get('/', function () {
    return response()->json([
        'platform' => 'NAZRA',
        'name' => 'منصة نظرة العقارية الذكية',
        'version' => '2.0',
        'status' => 'running',
    ]);
});
