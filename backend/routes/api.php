<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\OwnerController;
use App\Http\Controllers\AIController;

/*
|--------------------------------------------------------------------------
| المسارات العامة - Public Routes
|--------------------------------------------------------------------------
*/

// المصادقة مع Rate Limiting
Route::middleware('throttle:5,1')->post('/login', [AuthController::class, 'login']);
Route::middleware('throttle:3,1')->post('/register', [AuthController::class, 'register']);

// العقارات (قراءة فقط)
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/featured', [PropertyController::class, 'featured']);
Route::get('/properties/map', [PropertyController::class, 'map']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);
Route::get('/properties/{id}/similar', [PropertyController::class, 'similar']);
Route::post('/properties/compare', [PropertyController::class, 'compare']);

// التقييمات (عرض فقط)
Route::get('/properties/{propertyId}/reviews', [ReviewController::class, 'index']);

// الذكاء الاصطناعي (عام)
Route::post('/ai/estimate', [AIController::class, 'estimatePrice']);
Route::post('/ai/search', [AIController::class, 'smartSearch']);
Route::get('/ai/trends', [AIController::class, 'priceTrends']);
Route::get('/ai/health', [AIController::class, 'health']);

/*
|--------------------------------------------------------------------------
| المسارات المحمية - Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    
    // المصادقة
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/password', [AuthController::class, 'changePassword']);

    // المفضلات
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{propertyId}', [FavoriteController::class, 'destroy']);
    Route::get('/favorites/check/{propertyId}', [FavoriteController::class, 'check']);

    // التقييمات
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // الرسائل
    Route::get('/messages/inbox', [MessageController::class, 'inbox']);
    Route::get('/messages/sent', [MessageController::class, 'sent']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{id}', [MessageController::class, 'show']);
    Route::post('/messages/{id}/reply', [MessageController::class, 'reply']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);

    // التوصيات الذكية
    Route::post('/ai/recommend', [AIController::class, 'recommend']);

    // ========== مسارات المالك - Owner Routes ==========
    Route::middleware('owner')->prefix('owner')->group(function () {
        Route::get('/dashboard', [OwnerController::class, 'dashboard']);
        Route::get('/properties', [OwnerController::class, 'properties']);
        Route::get('/views', [OwnerController::class, 'viewStats']);

        // إضافة وتعديل وحذف العقارات
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{id}', [PropertyController::class, 'update']);
        Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);
    });

    // ========== مسارات الأدمن - Admin Routes ==========
    Route::middleware('admin')->prefix('admin')->group(function () {
        // لوحة التحكم
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/statistics', [AdminController::class, 'statistics']);
        
        // إدارة المستخدمين
        Route::get('/users', [AdminController::class, 'users']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::put('/users/{id}/verify', [AdminController::class, 'verifyUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        
        // إدارة العقارات
        Route::get('/properties', [AdminController::class, 'properties']);
        Route::get('/properties/pending', [AdminController::class, 'pendingProperties']);
        Route::put('/properties/{id}/approve', [AdminController::class, 'approveProperty']);
        Route::put('/properties/{id}/reject', [AdminController::class, 'rejectProperty']);
        Route::put('/properties/{id}/status', [AdminController::class, 'changePropertyStatus']);
        Route::put('/properties/{id}/featured', [AdminController::class, 'toggleFeatured']);
        Route::delete('/properties/{id}', [AdminController::class, 'deleteProperty']);
    });
});