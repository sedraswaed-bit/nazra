<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class OwnerMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'غير مصرح - يجب تسجيل الدخول'
            ], 401);
        }

        // الأدمن يقدر يوصل لكل شي - Admin can access everything
        if ($request->user()->isAdmin()) {
            return $next($request);
        }

        if (!$request->user()->isOwner()) {
            return response()->json([
                'message' => 'غير مصرح - صلاحية المالك مطلوبة'
            ], 403);
        }

        return $next($request);
    }
}