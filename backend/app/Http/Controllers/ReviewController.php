<?php
// متحكم التقييمات - Review Controller
// إضافة وعرض وحذف التقييمات - Add, list, delete reviews
// منصة نظرة - NAZRA Platform

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    // ========== عرض تقييمات عقار - List property reviews ==========
    public function index(int $propertyId)
    {
        $reviews = Review::where('property_id', $propertyId)
            ->with('user')
            ->latest()
            ->paginate(10);

        // إحصائيات التقييم - Rating stats
        $stats = [
            'average' => Review::where('property_id', $propertyId)->avg('rating'),
            'count' => Review::where('property_id', $propertyId)->count(),
            'distribution' => [
                5 => Review::where('property_id', $propertyId)->where('rating', 5)->count(),
                4 => Review::where('property_id', $propertyId)->where('rating', 4)->count(),
                3 => Review::where('property_id', $propertyId)->where('rating', 3)->count(),
                2 => Review::where('property_id', $propertyId)->where('rating', 2)->count(),
                1 => Review::where('property_id', $propertyId)->where('rating', 1)->count(),
            ],
        ];

        return response()->json([
            'reviews' => $reviews,
            'stats' => $stats,
        ]);
    }

    // ========== إضافة تقييم - Add review ==========
    public function store(Request $request)
    {
        $data = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        // منع التكرار - Prevent duplicate reviews
        if (Review::hasUserReviewed($request->user()->id, $data['property_id'])) {
            return response()->json([
                'message' => 'لقد قيّمت هذا العقار مسبقاً' // Already reviewed
            ], 409);
        }

        $review = Review::create([
            'user_id' => $request->user()->id,
            'property_id' => $data['property_id'],
            'rating' => $data['rating'],
            'comment' => $data['comment'] ?? null,
        ]);

        return response()->json([
            'review' => $review->load('user'),
            'message' => 'تم إضافة التقييم بنجاح' // Review added
        ], 201);
    }

    // ========== حذف تقييم - Delete review ==========
    public function destroy(Request $request, int $id)
    {
        $review = Review::findOrFail($id);

        // التحقق من الملكية أو صلاحية الأدمن - Verify ownership or admin
        if ($request->user()->id !== $review->user_id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'غير مصرح لك'], 403);
        }

        $review->delete();

        return response()->json([
            'message' => 'تم حذف التقييم' // Review deleted
        ]);
    }
}
