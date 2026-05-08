<?php
// إعدادات CORS / CORS Configuration

return [

    /*
    |----------------------------------------------------------------------
    | إعدادات مشاركة الموارد عبر الأصل / Cross-Origin Resource Sharing Settings
    |----------------------------------------------------------------------
    |
    | إعدادات CORS للسماح بالطلبات من الواجهة الأمامية
    | CORS settings to allow requests from the frontend
    |
    */

    // المسارات المسموح بها / Allowed paths
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // الأساليب المسموح بها / Allowed methods
    'allowed_methods' => ['*'],

    // الأصول المسموح بها / Allowed origins
    // ⚠️ إصلاح BUG #8: wildcard + credentials = invalid per CORS spec
    'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],

    // أنماط الأصول المسموح بها / Allowed origins patterns
    'allowed_origins_patterns' => [],

    // الرؤوس المسموح بها / Allowed headers
    'allowed_headers' => ['*'],

    // الرؤوس المكشوفة / Exposed headers
    'exposed_headers' => [],

    // أقصى عمر للتخزين المؤقت / Max age for cache
    'max_age' => 0,

    // دعم بيانات الاعتماد / Support credentials
    'supports_credentials' => true,

];
