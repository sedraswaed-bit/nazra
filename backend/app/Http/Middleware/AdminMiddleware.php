<?php
// وسيط الأدمن - Admin Middleware
// التحقق من أن المستخدم أدمن - Verify user is admin
// منصة نظرة - NAZRA Platform

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // التحقق من تسجيل الدخول وصلاحية الأدمن - Check auth and admin role
        if (!$request->user() || !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'غير مصرح - صلاحية الأدمن مطلوبة' // Admin access required
            ], 403);
        }

        return $next($request);
    }
}
