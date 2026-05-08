<?php
// متحكم المصادقة - Auth Controller
// تسجيل الدخول والخروج وإنشاء الحسابات - Login, logout, registration
// منصة نظرة - NAZRA Platform

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ========== تسجيل حساب جديد - Register new account ==========
    public function register(Request $request)
    {
        // التحقق من البيانات - Validate input
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|in:user,owner',   // المالك أو المستخدم
            'city' => 'nullable|string|max:100',
            'neighborhood' => 'nullable|string|max:100',
        ]);

        // إنشاء المستخدم - Create user
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'role' => $data['role'] ?? 'user',
            'city' => $data['city'] ?? null,
            'neighborhood' => $data['neighborhood'] ?? null,
        ]);

        // إنشاء توكن - Create token
        $token = $user->createToken('nazra-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'تم تسجيل الحساب بنجاح' // Account created successfully
        ], 201);
    }

    // ========== تسجيل الدخول - Login ==========
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // البحث عن المستخدم - Find user
        $user = User::where('email', $data['email'])->first();

        // التحقق من كلمة المرور - Check password
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['بيانات الدخول غير صحيحة'], // Invalid credentials
            ]);
        }

        $token = $user->createToken('nazra-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'تم تسجيل الدخول بنجاح' // Login successful
        ]);
    }

    // ========== تسجيل الخروج - Logout ==========
    public function logout(Request $request)
    {
        // حذف التوكن الحالي - Delete current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح' // Logout successful
        ]);
    }

    // ========== بيانات المستخدم الحالي - Current user data ==========
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('properties');  // تحميل العقارات - Load properties

        return response()->json([
            'user' => $user,
            'stats' => [
                'properties_count' => $user->properties()->count(),
                'favorites_count' => $user->favorites()->count(),
                'reviews_count' => $user->reviews()->count(),
                'unread_messages' => \App\Models\Message::unreadCount($user->id),
            ]
        ]);
    }

    // ========== تحديث الملف الشخصي - Update profile ==========
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'bio' => 'sometimes|nullable|string|max:500',
            'city' => 'sometimes|nullable|string|max:100',
            'neighborhood' => 'sometimes|nullable|string|max:100',
            'avatar' => 'sometimes|nullable|string',
        ]);

        $user->update($data);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'تم تحديث الملف الشخصي' // Profile updated
        ]);
    }

    // ========== تغيير كلمة المرور - Change password ==========
    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        // التحقق من كلمة المرور الحالية - Verify current password
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['كلمة المرور الحالية غير صحيحة'], // Wrong current password
            ]);
        }

        $user->update([
            'password' => Hash::make($data['password']),
        ]);

        return response()->json([
            'message' => 'تم تغيير كلمة المرور بنجاح' // Password changed successfully
        ]);
    }
}
