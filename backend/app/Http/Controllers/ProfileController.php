<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{


    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadCount('properties');

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_verified' => $user->is_verified,
                'avatar' => $user->avatar,
                'properties_count' => $user->properties_count,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | تحديث الملف الشخصي / Update profile
    |----------------------------------------------------------------------
    */

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string|max:500',
        ], [
            'name.string' => 'الاسم يجب أن يكون نصاً / Name must be a string',
            'name.max' => 'الاسم يجب أن يكون 255 حرف كحد أقصى / Name must be at most 255 characters',
            'email.email' => 'البريد الإلكتروني غير صالح / Invalid email format',
            'email.unique' => 'البريد الإلكتروني مستخدم بالفعل / Email already in use',
            'phone.max' => 'رقم الهاتف يجب أن يكون 20 رقماً كحد أقصى / Phone must be at most 20 characters',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صالحة / Invalid input data',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update($request->only(['name', 'email', 'phone', 'avatar']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الملف الشخصي بنجاح / Profile updated successfully',
            'data' => $user->fresh(),
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | تحديث كلمة المرور / Update password
    |----------------------------------------------------------------------
    */

    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'كلمة المرور الحالية مطلوبة / Current password is required',
            'password.required' => 'كلمة المرور الجديدة مطلوبة / New password is required',
            'password.min' => 'كلمة المرور يجب أن تكون 8 أحرف على الأقل / Password must be at least 8 characters',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق / Password confirmation does not match',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات غير صالحة / Invalid input data',
                'errors' => $validator->errors(),
            ], 422);
        }

        // التحقق من كلمة المرور الحالية / Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'كلمة المرور الحالية غير صحيحة / Current password is incorrect',
            ], 401);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // حذف جميع الرموز لإجبار إعادة تسجيل الدخول / Revoke all tokens to force re-login
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث كلمة المرور بنجاح يرجى تسجيل الدخول مرة أخرى / Password updated successfully, please login again',
        ]);
    }
}
