<?php
// وسيط التوجيه عند المصادقة / Redirect If Authenticated Middleware

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticated
{
    /**
     * التعامل مع الطلب الوارد / Handle an incoming request
     *
     * إذا كان المستخدم مصادقاً يتم توجيهه بعيداً عن صفحات المصادقة
     * If the user is authenticated, redirect away from auth pages
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // لطلبات API نرجع استجابة JSON / For API requests return JSON response
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'مصادق بالفعل / Already authenticated',
                    ], 400);
                }

                return redirect('/');
            }
        }

        return $next($request);
    }
}
