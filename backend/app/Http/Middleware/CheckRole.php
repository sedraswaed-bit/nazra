<?php
// وسيط التحقق من الدور / Check Role Middleware

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * التحقق من أن المستخدم المصادق عليه يملك الدور المطلوب
     * Verify that the authenticated user has the required role(s)
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles  الأدوار المطلوبة / Required roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // التحقق من تسجيل الدخول / Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصادق عليك / Unauthenticated',
            ], 401);
        }

        // التحقق من امتلاك المستخدم لأحد الأدوار المطلوبة / Check if user has any of the required roles
        if (!in_array($request->user()->role, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك بالوصول / Unauthorized access',
            ], 403);
        }

        return $next($request);
    }
}
