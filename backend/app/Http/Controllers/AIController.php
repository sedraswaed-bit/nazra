<?php
// متحكم الذكاء الاصطناعي - AI Controller
// التواصل مع خدمة الذكاء الاصطناعي - Communication with AI service
// منصة نظرة - NAZRA Platform

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    // رابط خدمة الذكاء الاصطناعي - AI service URL
    private function getAiUrl(): string
    {
        return env('AI_SERVICE_URL', 'http://localhost:5001');
    }

    // ========== توقع السعر - Price estimation ==========
    public function estimatePrice(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string',
            'city' => 'sometimes|nullable|string',
            'neighborhood' => 'sometimes|nullable|string',
            'area' => 'required|numeric|min:1',
            'rooms' => 'sometimes|nullable|integer',
            'bathrooms' => 'sometimes|nullable|integer',
            'floor' => 'sometimes|nullable',
            'condition' => 'sometimes|nullable|string',
            'ownership_type' => 'sometimes|nullable|string',
            'area_class' => 'sometimes|nullable|string',
            'features' => 'sometimes|array',
        ]);

        try {
            // تحويل أسماء الحقول لما يتوقعه Flask - Map field names for Flask
            $aiPayload = [
                'location' => $data['neighborhood'] ?? $data['city'] ?? 'المزة',
                'property_type' => $data['type'],
                'area_sqm' => $data['area'],
                'bedrooms' => $data['rooms'] ?? 0,
                'bathrooms' => $data['bathrooms'] ?? 1,
                'condition' => $data['condition'] ?? 'جيد',
                'floor' => isset($data['floor']) ? (string)$data['floor'] : 'أول',
                'ownership_type' => $data['ownership_type'] ?? 'طابو أخضر',
                'area_class' => $data['area_class'] ?? 'متوسطة',
            ];

            $response = Http::timeout(10)->post($this->getAiUrl() . '/estimate', $aiPayload);

            if ($response->successful()) {
                $aiResult = $response->json();
                $exchangeRate = (int) env('EXCHANGE_RATE_SYP', 10000);
                $estimatedUsd = $aiResult['estimated_price_usd'] ?? $aiResult['estimated_price'] ?? 0;
                $estimatedSyp = $estimatedUsd * $exchangeRate;

                $rangeMinUsd = $aiResult['price_range_usd']['min'] ?? ($estimatedUsd * 0.85);
                $rangeMaxUsd = $aiResult['price_range_usd']['max'] ?? ($estimatedUsd * 1.15);

                $rawConfidence = $aiResult['confidence'] ?? 50;
                $normalizedConfidence = is_numeric($rawConfidence) ? min(1.0, max(0.0, $rawConfidence / 100)) : 0.5;

                return response()->json([
                    'estimated_price' => $estimatedSyp,
                    'price_range' => [
                        'min' => $rangeMinUsd * $exchangeRate,
                        'max' => $rangeMaxUsd * $exchangeRate,
                    ],
                    'confidence' => $normalizedConfidence,
                    'explanation' => $aiResult['explanation'] ?? 'تقدير مبني على بيانات عقارات مشابهة في المنطقة',
                    'price_per_sqm' => ($aiResult['price_per_sqm_usd'] ?? 0) * $exchangeRate,
                    'price_usd' => $estimatedUsd,
                    'exchange_rate' => $exchangeRate,
                    'currency' => 'ل.س',
                ]);
            }

            // Fallback تقدير محلي بدون AI
            return $this->fallbackPriceEstimate($data);

        } catch (\Exception $e) {
            return $this->fallbackPriceEstimate($data);
        }
    }

    // ========== البحث الذكي - Smart search ==========
    public function smartSearch(Request $request)
    {
        $data = $request->validate([
            'query' => 'required|string|min:2',
        ]);

        try {
            $response = Http::timeout(10)->post($this->getAiUrl() . '/search', [
                'query' => $data['query'],
            ]);

            if ($response->successful()) {
                $flaskResult = $response->json();

                // تحويل أسماء الحقول من Flask لما يتوقعه Frontend
                // Flask يستخدم: location, price_usd, area_sqm, bedrooms
                // Frontend يتوقع: neighborhood, price (ليرة), area, rooms
                $exchangeRate = (int) env('EXCHANGE_RATE_SYP', 10000);

                // تحويل الحقول المفسرة - Map interpreted fields
                if (isset($flaskResult['interpreted'])) {
                    $interp = $flaskResult['interpreted'];

                    // تحويل location → neighborhood
                    if (isset($interp['location']) && !isset($interp['neighborhood'])) {
                        $flaskResult['interpreted']['neighborhood'] = $interp['location'];
                    }

                    // تحويل bedrooms → rooms
                    if (isset($interp['bedrooms']) && !isset($interp['rooms'])) {
                        $flaskResult['interpreted']['rooms'] = (int) $interp['bedrooms'];
                    }
                }

                // تحويل نتائج العقارات - Map property results
                if (isset($flaskResult['results']) && is_array($flaskResult['results'])) {
                    $flaskResult['results'] = array_map(function ($prop) use ($exchangeRate) {
                        // تحويل price_usd → price (بالليرة)
                        if (isset($prop['price_usd']) && !isset($prop['price'])) {
                            $prop['price'] = (int) ($prop['price_usd'] * $exchangeRate);
                        }
                        // تحويل area_sqm → area
                        if (isset($prop['area_sqm']) && !isset($prop['area'])) {
                            $prop['area'] = (float) $prop['area_sqm'];
                        }
                        // تحويل bedrooms → rooms
                        if (isset($prop['bedrooms']) && !isset($prop['rooms'])) {
                            $prop['rooms'] = (int) $prop['bedrooms'];
                        }
                        // تحويل location → neighborhood
                        if (isset($prop['location']) && !isset($prop['neighborhood'])) {
                            $prop['neighborhood'] = $prop['location'];
                        }
                        // تحويل property_type → type
                        if (isset($prop['property_type']) && !isset($prop['type'])) {
                            $prop['type'] = $prop['property_type'];
                        }
                        return $prop;
                    }, $flaskResult['results']);
                }

                return response()->json($flaskResult);
            }

            // Fallback: بحث محلي بدون AI
            return $this->fallbackSmartSearch($data['query']);

        } catch (\Exception $e) {
            return $this->fallbackSmartSearch($data['query']);
        }
    }

    // ========== التوصيات - Recommendations ==========
    public function recommend(Request $request)
    {
        $data = $request->validate([
            'property_id' => 'sometimes|nullable|integer',
            'preferences' => 'sometimes|array',
        ]);

        try {
            $response = Http::timeout(10)->post($this->getAiUrl() . '/recommend', $data);

            if ($response->successful()) {
                $result = $response->json();

                // تحويل أسماء الحقول في نتائج التوصيات
                if (isset($result['recommendations']) && is_array($result['recommendations'])) {
                    $exchangeRate = (int) env('EXCHANGE_RATE_SYP', 10000);
                    $result['recommendations'] = array_map(function ($rec) use ($exchangeRate) {
                        if (isset($rec['property'])) {
                            $prop = $rec['property'];
                            if (isset($prop['price_usd']) && !isset($prop['price'])) {
                                $rec['property']['price'] = (int) ($prop['price_usd'] * $exchangeRate);
                            }
                            if (isset($prop['area_sqm']) && !isset($prop['area'])) {
                                $rec['property']['area'] = (float) $prop['area_sqm'];
                            }
                            if (isset($prop['bedrooms']) && !isset($prop['rooms'])) {
                                $rec['property']['rooms'] = (int) $prop['bedrooms'];
                            }
                            if (isset($prop['location']) && !isset($prop['neighborhood'])) {
                                $rec['property']['neighborhood'] = $prop['location'];
                            }
                            if (isset($prop['property_type']) && !isset($prop['type'])) {
                                $rec['property']['type'] = $prop['property_type'];
                            }
                        }
                        return $rec;
                    }, $result['recommendations']);
                }

                return response()->json($result);
            }

            return response()->json([
                'error' => 'فشل في الحصول على التوصيات',
                'recommendations' => [],
            ], 503);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'خدمة الذكاء الاصطناعي غير متاحة',
                'recommendations' => [],
            ], 503);
        }
    }

    // ========== اتجاهات الأسعار - Price trends ==========
    public function priceTrends(Request $request)
    {
        $data = $request->validate([
            'city' => 'sometimes|nullable|string',
            'type' => 'sometimes|nullable|string',
            'period' => 'sometimes|nullable|string|in:6m,1y,2y,all',
        ]);

        try {
            $response = Http::timeout(10)->get($this->getAiUrl() . '/trends', $data);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json([
                'error' => 'فشل في تحميل الاتجاهات',
                'trends' => [],
            ], 503);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'خدمة الذكاء الاصطناعي غير متاحة',
                'trends' => [],
            ], 503);
        }
    }

    // ========== حالة خدمة الذكاء - AI service health ==========
    public function health()
    {
        try {
            $response = Http::timeout(5)->get($this->getAiUrl() . '/health');

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['status' => 'unhealthy'], 503);

        } catch (\Exception $e) {
            return response()->json(['status' => 'unavailable'], 503);
        }
    }

    // ========== دوال مساعدة - Helper methods ==========

    /**
     * تقدير سعر بديل بدون AI - Fallback price estimate without AI
     */
    private function fallbackPriceEstimate(array $data)
    {
        $exchangeRate = (int) env('EXCHANGE_RATE_SYP', 10000);
        $area = (float)($data['area'] ?? 100);

        // تقدير بناءً على النوع والمنطقة - Estimate based on type and location
        $basePricePerSqm = 800; // USD per sqm base
        $location = $data['neighborhood'] ?? $data['city'] ?? 'المزة';

        // تعديل السعر حسب المنطقة - Adjust by location
        $premiumAreas = ['المالكي', 'أبو رمانة', 'الشعلان', 'باب توما'];
        $midAreas = ['المزة', 'كفرسوسة', 'دمر'];
        if (in_array($location, $premiumAreas)) {
            $basePricePerSqm = 2000;
        } elseif (in_array($location, $midAreas)) {
            $basePricePerSqm = 1200;
        }

        // تعديل السعر حسب النوع - Adjust by type
        $type = $data['type'] ?? 'شقة';
        if (in_array($type, ['فيلا', 'villa'])) {
            $basePricePerSqm *= 1.5;
        } elseif (in_array($type, ['مكتب', 'office'])) {
            $basePricePerSqm *= 1.2;
        }

        $fallbackUsd = $area * $basePricePerSqm;
        $fallbackSyp = $fallbackUsd * $exchangeRate;

        return response()->json([
            'estimated_price' => $fallbackSyp,
            'price_range' => [
                'min' => $fallbackSyp * 0.85,
                'max' => $fallbackSyp * 1.15,
            ],
            'confidence' => 0.3,
            'explanation' => 'خدمة الذكاء الاصطناعي غير متاحة حالياً. هذا تقدير تقريبي بناءً على متوسط الأسعار.',
            'price_per_sqm' => $basePricePerSqm * $exchangeRate,
            'price_usd' => $fallbackUsd,
            'exchange_rate' => $exchangeRate,
            'currency' => 'ل.س',
        ]);
    }

    /**
     * بحث ذكي بديل بدون AI - Fallback smart search without AI
     */
    private function fallbackSmartSearch(string $query)
    {
        // بحث بسيط في قاعدة البيانات المحلية - Simple local DB search
        $properties = \App\Models\Property::where('is_approved', true)
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%")
                  ->orWhere('location', 'LIKE', "%{$query}%")
                  ->orWhere('property_type', 'LIKE', "%{$query}%");
            })
            ->with('owner')
            ->take(10)
            ->get();

        return response()->json([
            'query' => $query,
            'interpreted' => [
                'neighborhood' => null,
                'type' => null,
                'rooms' => null,
                'features' => [],
            ],
            'description' => 'نتائج البحث المحلي (خدمة الذكاء الاصطناعي غير متاحة)',
            'results' => $properties,
            'count' => $properties->count(),
        ]);
    }
}
