<?php
// متحكم المفضلات - Favorites Controller
// إضافة وحذف وعرض العقارات المفضلة - Add, remove, list favorite properties
// منصة نظرة - NAZRA Platform

namespace App\Http\Controllers;

use App\Models\Favorite;
use App\Models\Property;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    // ========== عرض المفضلات - List favorites ==========
    public function index(Request $request)
    {
        $favorites = $request->user()
            ->favorites()
            ->with('owner')
            ->paginate(12);

        return response()->json($favorites);
    }

    // ========== إضافة للمفضلة - Add to favorites ==========
    public function store(Request $request)
    {
        $data = $request->validate([
            'property_id' => 'required|exists:properties,id',
        ]);

        // التحقق من عدم التكرار - Check not already favorited
        $exists = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $data['property_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'العقار مضاف مسبقاً للمفضلة' // Already favorited
            ], 409);
        }

        Favorite::create([
            'user_id' => $request->user()->id,
            'property_id' => $data['property_id'],
        ]);

        return response()->json([
            'message' => 'تم الإضافة للمفضلة' // Added to favorites
        ], 201);
    }

    // ========== حذف من المفضلة - Remove from favorites ==========
    public function destroy(Request $request, int $propertyId)
    {
        $deleted = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $propertyId)
            ->delete();

        if ($deleted) {
            return response()->json([
                'message' => 'تم الحذف من المفضلة' // Removed from favorites
            ]);
        }

        return response()->json([
            'message' => 'العقار غير موجود في المفضلة' // Not in favorites
        ], 404);
    }

    // ========== التحقق من المفضلة - Check if favorited ==========
    public function check(Request $request, int $propertyId)
    {
        $isFavorited = Favorite::where('user_id', $request->user()->id)
            ->where('property_id', $propertyId)
            ->exists();

        return response()->json(['is_favorited' => $isFavorited]);
    }
}
