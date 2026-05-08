<?php
// متحكم لوحة تحكم الأدمن - Admin Dashboard Controller
// إدارة المستخدمين والعقارات ومراقبة النظام - User/property management and system monitoring
// منصة نظرة - NAZRA Platform

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Property;
use App\Models\Review;
use App\Models\Message;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // ========== لوحة التحكم الرئيسية - Main dashboard ==========
    public function dashboard()
    {
        // إحصائيات عامة - General statistics
        $stats = [
            'total_users' => User::count(),
            'total_owners' => User::where('role', 'owner')->count(),
            'total_properties' => Property::count(),
            'pending_properties' => Property::where('status', 'pending')->count(),
            'approved_properties' => Property::where('status', 'approved')->count(),
            'rejected_properties' => Property::where('status', 'rejected')->count(),
            'sold_properties' => Property::where('status', 'sold')->count(),
            'total_reviews' => Review::count(),
            'total_messages' => Message::count(),
            'total_views' => Property::sum('views_count'),
        ];

        // أحدث العقارات المعلقة - Latest pending properties
        $pendingProperties = Property::where('status', 'pending')
            ->with('owner')
            ->latest()
            ->take(5)
            ->get();

        // أحدث المستخدمين - Latest users
        $latestUsers = User::latest()->take(5)->get();

        // العقارات حسب المدينة - Properties by city (نستخدم location لأنه الحقل الفعلي)
        $byCity = Property::where('status', 'approved')
            ->selectRaw('location as city, count(*) as count')
            ->groupBy('location')
            ->pluck('count', 'city')
            ->toArray();

        // العقارات حسب النوع - Properties by type (نستخدم property_type لأنه الحقل الفعلي)
        $byType = Property::where('status', 'approved')
            ->selectRaw('property_type as type, count(*) as count')
            ->groupBy('property_type')
            ->pluck('count', 'type')
            ->toArray();

        return response()->json([
            'stats' => $stats,
            'pending_properties' => $pendingProperties,
            'latest_users' => $latestUsers,
            'by_city' => $byCity,
            'by_type' => $byType,
        ]);
    }

    // ========== إحصائيات فقط - Stats only ==========
    public function stats()
    {
        $stats = [
            'total_users' => User::count(),
            'total_owners' => User::where('role', 'owner')->count(),
            'total_properties' => Property::count(),
            'pending_properties' => Property::where('status', 'pending')->count(),
            'approved_properties' => Property::where('status', 'approved')->count(),
            'rejected_properties' => Property::where('status', 'rejected')->count(),
            'sold_properties' => Property::where('status', 'sold')->count(),
            'total_reviews' => Review::count(),
            'total_messages' => Message::count(),
            'total_views' => Property::sum('views_count'),
        ];

        return response()->json($stats);
    }

    // ========== إدارة المستخدمين - User management ==========
    public function users(Request $request)
    {
        $query = User::query();

        // فلترة حسب الصلاحية - Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // بحث بالاسم أو البريد - Search by name or email
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        $users = $query->withCount('properties')
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    // ========== تعديل مستخدم - Update user ==========
    public function updateUser(Request $request, int $id)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:user,owner,admin',
            'is_verified' => 'sometimes|boolean',
            'phone' => 'nullable|string|max:20',
        ]);

        $user->update($data);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'تم تحديث بيانات المستخدم'
        ]);
    }

    // ========== توثيق مستخدم - Verify user ==========
    public function verifyUser(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_verified' => true]);

        return response()->json([
            'user' => $user->fresh(),
            'message' => 'تم توثيق المستخدم'
        ]);
    }

    // ========== حذف مستخدم - Delete user ==========
    public function deleteUser(int $id)
    {
        $user = User::findOrFail($id);

        // منع حذف نفسك - Prevent self-deletion
        if ($user->id === request()->user()->id) {
            return response()->json([
                'message' => 'لا يمكنك حذف حسابك'
            ], 403);
        }

        // منع حذف آخر أدمن - Prevent deleting last admin
        if ($user->isAdmin() && User::where('role', 'admin')->count() <= 1) {
            return response()->json([
                'message' => 'لا يمكنك حذف آخر مدير'
            ], 403);
        }

        $user->delete();

        return response()->json([
            'message' => 'تم حذف المستخدم'
        ]);
    }

    // ========== جميع العقارات مع فلترة - All properties with filter ==========
    public function properties(Request $request)
    {
        $query = Property::with('owner');

        // فلترة حسب الحالة - Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // بحث بالعنوان - Search by title
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        $properties = $query->withCount('reviews')
            ->latest()
            ->paginate(15);

        return response()->json($properties);
    }

    // ========== العقارات المعلقة - Pending properties ==========
    public function pendingProperties()
    {
        $properties = Property::where('status', 'pending')
            ->with('owner')
            ->latest()
            ->paginate(15);

        return response()->json($properties);
    }

    // ========== قبول عقار - Approve property ==========
    public function approveProperty(int $id)
    {
        $property = Property::findOrFail($id);
        $property->update([
            'status' => 'approved',
            'is_approved' => true,
        ]);

        return response()->json([
            'property' => $property->fresh(),
            'message' => 'تم قبول العقار'
        ]);
    }

    // ========== رفض عقار - Reject property ==========
    public function rejectProperty(Request $request, int $id)
    {
        $property = Property::findOrFail($id);
        $property->update([
            'status' => 'rejected',
            'is_approved' => false,
        ]);

        return response()->json([
            'property' => $property->fresh(),
            'message' => 'تم رفض العقار'
        ]);
    }

    // ========== تغيير حالة العقار - Change property status ==========
    public function changePropertyStatus(Request $request, int $id)
    {
        $property = Property::findOrFail($id);

        $data = $request->validate([
            'status' => 'required|in:pending,approved,rejected,sold',
        ]);

        $property->update([
            'status' => $data['status'],
            'is_approved' => $data['status'] === 'approved',
        ]);

        return response()->json([
            'property' => $property->fresh(),
            'message' => 'تم تحديث حالة العقار'
        ]);
    }

    // ========== تبديل المميز - Toggle featured ==========
    public function toggleFeatured(int $id)
    {
        $property = Property::findOrFail($id);
        $property->update(['is_featured' => !$property->is_featured]);

        return response()->json([
            'property' => $property->fresh(),
            'message' => $property->is_featured ? 'تم التمييز' : 'تم إلغاء التمييز'
        ]);
    }

    // ========== حذف عقار - Delete property ==========
    public function deleteProperty(int $id)
    {
        $property = Property::findOrFail($id);
        $property->delete();

        return response()->json([
            'message' => 'تم حذف العقار'
        ]);
    }

    // ========== إحصائيات النظام - System statistics ==========
    public function statistics()
    {
        // إحصائيات شهرية - Monthly statistics
        $monthlyProperties = Property::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, count(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        $monthlyUsers = User::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, count(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('count', 'month')
            ->toArray();

        // متوسط الأسعار حسب النوع - Average prices by type
        $avgPriceByType = Property::where('status', 'approved')
            ->selectRaw('property_type as type, avg(price_usd) as avg_price, count(*) as count')
            ->groupBy('property_type')
            ->get()
            ->keyBy('type')
            ->toArray();

        return response()->json([
            'monthly_properties' => $monthlyProperties,
            'monthly_users' => $monthlyUsers,
            'avg_price_by_type' => $avgPriceByType,
        ]);
    }
}