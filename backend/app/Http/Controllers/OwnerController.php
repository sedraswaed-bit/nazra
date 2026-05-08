<?php
// متحكم لوحة تحكم المالك - Owner Dashboard Controller
// إحصائيات وإدارة عقارات المالك - Owner statistics and property management
// منصة نظرة - NAZRA Platform

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Message;
use App\Models\Review;
use Illuminate\Http\Request;

class OwnerController extends Controller
{
    // ========== لوحة تحكم المالك - Owner dashboard ==========
    public function dashboard(Request $request)
    {
        $owner = $request->user();

        // إحصائيات المالك - Owner statistics
        $stats = [
            'total_properties' => Property::where('owner_id', $owner->id)->count(),
            'approved_properties' => Property::where('owner_id', $owner->id)->where('status', 'approved')->count(),
            'pending_properties' => Property::where('owner_id', $owner->id)->where('status', 'pending')->count(),
            'total_views' => Property::where('owner_id', $owner->id)->sum('views_count'),
            'total_reviews' => Review::whereIn('property_id', 
                Property::where('owner_id', $owner->id)->pluck('id')
            )->count(),
            'average_rating' => Review::whereIn('property_id',
                Property::where('owner_id', $owner->id)->pluck('id')
            )->avg('rating'),
            'unread_messages' => Message::where('receiver_id', $owner->id)
                ->where('is_read', false)->count(),
        ];

        // أكثر العقارات مشاهدة - Most viewed properties
        $topProperties = Property::where('owner_id', $owner->id)
            ->where('status', 'approved')
            ->orderBy('views_count', 'desc')
            ->take(5)
            ->get();

        // آخر الرسائل - Latest messages
        $latestMessages = Message::where('receiver_id', $owner->id)
            ->with(['sender', 'property'])
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'stats' => $stats,
            'top_properties' => $topProperties,
            'latest_messages' => $latestMessages,
            'is_verified' => $owner->is_verified,
        ]);
    }

    // ========== عقارات المالك - Owner's properties ==========
    public function properties(Request $request)
    {
        $properties = Property::where('owner_id', $request->user()->id)
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->latest()
            ->paginate(12);

        return response()->json($properties);
    }

    // ========== إحصائيات مشاهدات المالك - Owner view statistics ==========
    public function viewStats(Request $request)
    {
        $ownerId = $request->user()->id;

        // مشاهدات حسب العقار - Views by property
        $viewsByProperty = Property::where('owner_id', $ownerId)
            ->where('status', 'approved')
            ->select('id', 'title', 'views_count')
            ->orderBy('views_count', 'desc')
            ->get();

        // إجمالي المشاهدات - Total views
        $totalViews = $viewsByProperty->sum('views_count');

        return response()->json([
            'views_by_property' => $viewsByProperty,
            'total_views' => $totalViews,
        ]);
    }
}
