<?php
// متحكم العقارات
// إدارة عرض وإضافة وتعديل وحذف العقارات

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PropertyController extends Controller
{

     public function index(Request $request)
    {
        $query = Property::where('is_approved', true)->where('status', 'approved')->with('owner');

        // فلترة حسب الحي
        if ($request->filled('neighborhood')) {
            $query->where('location', $request->neighborhood);
        }

        // فلترة حسب النوع
        if ($request->filled('type')) {
            $query->where('property_type', $request->type);
        }

        // فلترة حسب السعر - يدعم ليرة ودولار
        $exchangeRate = (int) env('EXCHANGE_RATE_SYP', 10000);
        if ($request->filled('price_min')) {
            $priceMin = (float) $request->price_min;
            $priceMinUsd = $priceMin > 1000000 ? $priceMin / $exchangeRate : $priceMin;
            $query->where('price_usd', '>=', $priceMinUsd);
        }
        if ($request->filled('price_max')) {
            $priceMax = (float) $request->price_max;
            $priceMaxUsd = $priceMax > 1000000 ? $priceMax / $exchangeRate : $priceMax;
            $query->where('price_usd', '<=', $priceMaxUsd);
        }

        // فلترة حسب المساحة
        if ($request->filled('area_min')) {
            $query->where('area_sqm', '>=', $request->area_min);
        }
        if ($request->filled('area_max')) {
            $query->where('area_sqm', '<=', $request->area_max);
        }

        // فلترة حسب الغرف
        if ($request->filled('rooms')) {
            $roomsVal = (int) $request->rooms;
            if ($roomsVal >= 5) {
                $query->where('bedrooms', '>=', 5);
            } else {
                $query->where('bedrooms', $roomsVal);
            }
        }

        // فلترة حسب المميزات
        $features = ['furnished', 'parking', 'elevator', 'balcony', 'garden', 'pool'];
        foreach ($features as $feature) {
            if ($request->filled($feature) && $request->$feature) {
                $query->where($feature, true);
            }
        }

        // البحث في العنوان أو الوصف أو الموقع
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%")
                  ->orWhere('location', 'LIKE', "%{$search}%");
            });
        }

        // الترتيب
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');

        if ($sortBy === 'popular') {
            $query->orderBy('views_count', 'desc');
        } elseif ($sortBy === 'price_low') {
            $query->orderBy('price_usd', 'asc');
        } elseif ($sortBy === 'price_high') {
            $query->orderBy('price_usd', 'desc');
        } elseif ($sortBy === 'newest') {
            $query->orderBy('created_at', 'desc');
        } else {
            $allowedSorts = ['price_usd', 'area_sqm', 'created_at', 'views_count', 'bedrooms'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
            }
        }

        // العقارات المميزة أولاً
        $query->orderBy('is_featured', 'desc');

        // الصفحات
        $perPage = $request->get('per_page', 12);
        $properties = $query->paginate($perPage);

        return response()->json($properties);
    }

    public function show(int $id)
    {
        $property = Property::where('is_approved', true)
            ->with(['owner', 'reviews.user'])
            ->withCount('reviews')
            ->findOrFail($id);

        $property->increment('views_count');

        // عقارات مشابهة
        $similar = Property::where('id', '!=', $id)
            ->where('is_approved', true)
            ->where('property_type', $property->property_type)
            ->with('owner')
            ->take(4)
            ->get();

        if ($similar->count() < 4) {
            $moreSimilar = Property::where('id', '!=', $id)
                ->where('is_approved', true)
                ->where('location', $property->location)
                ->whereNotIn('id', $similar->pluck('id'))
                ->with('owner')
                ->take(4 - $similar->count())
                ->get();
            $similar = $similar->merge($moreSimilar);
        }

        $avgRating = $property->reviews()->avg('rating') ?? 0;

        $propertyData = $property->toArray();
        $propertyData['average_rating'] = round($avgRating, 1);
        $propertyData['reviews_count'] = $property->reviews_count;

        return response()->json([
            'property' => $propertyData,
            'similar' => $similar,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_usd' => 'required|numeric|min:0',
            'property_type' => 'required|in:apartment,villa,house,land,office,shop,شقة,فيلا,منزل,أرض,مكتب,محل تجاري',
            'location' => 'required|string',
            'address' => 'nullable|string',
            'direction' => 'nullable|string',
            'year_built' => 'nullable|integer|min:1900|max:2030',
            'area_sqm' => 'required|numeric|min:1',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'floor' => 'nullable|integer',
            'furnished' => 'boolean',
            'parking' => 'boolean',
            'elevator' => 'boolean',
            'balcony' => 'boolean',
            'garden' => 'boolean',
            'pool' => 'boolean',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'gallery_images' => 'nullable|array',
            'gallery_images.*' => 'string',
        ]);

        $data['owner_id'] = $request->user()->id;
        $data['is_approved'] = false;
        $data['status'] = 'pending';

        if (!empty($data['area_sqm']) && $data['area_sqm'] > 0) {
            $data['price_per_sqm_usd'] = round($data['price_usd'] / $data['area_sqm'], 2);
        }

        try {
            $aiServiceUrl = env('AI_SERVICE_URL', 'http://localhost:5001');
            $aiResponse = Http::post("{$aiServiceUrl}/estimate", [
                'type' => $data['property_type'],
                'location' => $data['location'],
                'area' => $data['area_sqm'],
                'rooms' => $data['bedrooms'] ?? 0,
                'floor' => $data['floor'] ?? 0,
                'features' => [
                    'furnished' => $data['furnished'] ?? false,
                    'parking' => $data['parking'] ?? false,
                    'elevator' => $data['elevator'] ?? false,
                    'balcony' => $data['balcony'] ?? false,
                    'garden' => $data['garden'] ?? false,
                    'pool' => $data['pool'] ?? false,
                ],
            ]);

            if ($aiResponse->successful()) {
                $aiResult = $aiResponse->json();
                $data['ai_price_estimate'] = $aiResult['estimated_price'] ?? null;
                $data['ai_confidence'] = $aiResult['confidence'] ?? null;
                $data['ai_explanation'] = $aiResult['explanation'] ?? null;
            }
        } catch (\Exception $e) {
            // في حال فشل خدمة الذكاء الاصطناعي
        }

        $property = Property::create($data);

        return response()->json([
            'property' => $property->load('owner'),
            'message' => 'تم إضافة العقار بنجاح، بانتظار المراجعة'
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $property = Property::findOrFail($id);
        $user = $request->user();
        if (!$user->isAdmin() && $property->owner_id !== $user->id) {
            return response()->json([
                'message' => 'غير مصرح - هذا العقار ليس ملكك'
            ], 403);
        }

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'price_usd' => 'sometimes|numeric|min:0',
            'property_type' => 'sometimes|in:apartment,villa,house,land,office,shop,شقة,فيلا,منزل,أرض,مكتب,محل تجاري',
            'location' => 'sometimes|string',
            'address' => 'nullable|string',
            'area_sqm' => 'sometimes|numeric|min:1',
            'bedrooms' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'floor' => 'nullable|integer',
            'direction' => 'nullable|string',
            'year_built' => 'nullable|integer|min:1900|max:2030',
            'furnished' => 'boolean',
            'parking' => 'boolean',
            'elevator' => 'boolean',
            'balcony' => 'boolean',
            'garden' => 'boolean',
            'pool' => 'boolean',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'gallery_images' => 'nullable|array',
        ]);

        if (isset($data['price_usd']) || isset($data['area_sqm'])) {
            $price = $data['price_usd'] ?? $property->price_usd;
            $area = $data['area_sqm'] ?? $property->area_sqm;
            if ($area > 0) {
                $data['price_per_sqm_usd'] = round($price / $area, 2);
            }
        }

        $property->update($data);

        return response()->json([
            'property' => $property->fresh()->load('owner'),
            'message' => 'تم تحديث العقار بنجاح'
        ]);
    }

    public function destroy(Request $request, int $id)
    {
        $property = Property::findOrFail($id);
        $user = $request->user();
        if (!$user->isAdmin() && $property->owner_id !== $user->id) {
            return response()->json([
                'message' => 'غير مصرح - هذا العقار ليس ملكك'
            ], 403);
        }

        $property->delete();

        return response()->json([
            'message' => 'تم حذف العقار'
        ]);
    }

    public function featured()
    {
        $properties = Property::where('is_approved', true)
            ->where('is_featured', true)
            ->with('owner')
            ->latest()
            ->take(8)
            ->get();

        return response()->json($properties);
    }

    public function similar(int $id)
    {
        $property = Property::findOrFail($id);

        $similar = Property::where('id', '!=', $id)
            ->where('is_approved', true)
            ->where('property_type', $property->property_type)
            ->where('location', $property->location)
            ->take(6)
            ->get();

        if ($similar->count() < 4) {
            $moreSimilar = Property::where('id', '!=', $id)
                ->where('is_approved', true)
                ->where('property_type', $property->property_type)
                ->whereNotIn('id', $similar->pluck('id'))
                ->take(6 - $similar->count())
                ->get();
            $similar = $similar->merge($moreSimilar);
        }

        return response()->json($similar);
    }

    public function compare(Request $request)
    {
        $ids = $request->validate([
            'ids' => 'required|array|min:2|max:4',
            'ids.*' => 'required|integer|exists:properties,id',
        ]);

        $properties = Property::whereIn('id', $ids['ids'])
            ->where('is_approved', true)
            ->with('owner')
            ->get();

        return response()->json([
            'properties' => $properties,
            'comparison_fields' => [
                'price_usd' => 'السعر',
                'area_sqm' => 'المساحة',
                'bedrooms' => 'الغرف',
                'bathrooms' => 'الحمامات',
                'floor' => 'الطابق',
                'furnished' => 'مفروش',
                'parking' => 'موقف سيارات',
                'elevator' => 'مصعد',
                'balcony' => 'شرفة',
                'garden' => 'حديقة',
                'pool' => 'مسبح',
                'location' => 'الحي',
                'price_per_sqm_usd' => 'سعر المتر',
            ]
        ]);
    }

    public function map(Request $request)
    {
        $query = Property::where('is_approved', true)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select(['id', 'title', 'price_usd', 'property_type', 'location', 'latitude', 'longitude', 'main_image']);

        if ($request->filled('neighborhood')) {
            $query->where('location', $request->neighborhood);
        }

        if ($request->filled('type')) {
            $query->where('property_type', $request->type);
        }

        if ($request->filled('price_min')) {
            $query->where('price_usd', '>=', $request->price_min);
        }
        if ($request->filled('price_max')) {
            $query->where('price_usd', '<=', $request->price_max);
        }

        return response()->json($query->get());
    }
}