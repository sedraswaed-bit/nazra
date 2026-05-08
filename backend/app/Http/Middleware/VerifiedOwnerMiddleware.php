<?php
// وسيط المالك الموثق - Verified Owner Middleware
// التحقق من أن المستخدم مالك موثق - Verify user is a verified owner
// منصة نظرة - NAZRA Platform

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifiedOwnerMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // التحقق من صلاحية المالك والتوثيق - Check owner role and verification
        if (!$request->user() || !$request->user()->isOwner()) {
            return response()->json([
                'message' => 'غير مصرح - صلاحية المالك مطلوبة'
            ], 403);
        }

        if (!$request->user()->is_verified) {
            return response()->json([
                'message' => 'الحساب غير موثق - يرجى التواصل مع الإدارة' // Account not verified
            ], 403);
        }

        return $next($request);
    }
}
