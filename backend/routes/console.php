<?php
// أوامر الكونسول / Console commands
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('عرض اقتباس ملهم / Display an inspiring quote');
