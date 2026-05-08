<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PropertySeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = database_path('data/damascus_properties.csv');

        if (!file_exists($csvPath)) {
            $this->command->error('CSV not found: ' . $csvPath);
            return;
        }

        $handle = fopen($csvPath, 'r');
        $headers = fgetcsv($handle);

        $count = 0;
        $batch = [];
        $ownerId = 2;

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 20) continue;

            $data = array_combine($headers, $row);

            // تحليل المميزات النصية وتحويلها لأعمدة منطقية
            // Parse text features and convert to boolean columns
            $featuresText = $data['features'] ?? '';
            $furnished = $this->hasFeature($featuresText, ['مفروش', 'مفروشة', 'Furnished']);
            $parking = $this->hasFeature($featuresText, ['موقف', 'مرآب', 'باركينغ', 'كراج', 'Parking']);
            $elevator = $this->hasFeature($featuresText, ['مصعد', 'اسانسير', 'Elevator']);
            $balcony = $this->hasFeature($featuresText, ['شرفة', 'بلكونة', 'بلكون', 'Balcony']);
            $garden = $this->hasFeature($featuresText, ['حديقة', 'بستان', 'Garden']);
            $pool = $this->hasFeature($featuresText, ['مسبح', 'سباحة', 'Pool']);

            // تحويل المميزات النصية لمصفوفة JSON
            // Convert text features to JSON array
            $featuresArray = array_filter(array_map('trim', explode(',', $featuresText)));
            $featuresJson = !empty($featuresArray) ? json_encode($featuresArray, JSON_UNESCAPED_UNICODE) : null;

            $batch[] = [
                'title' => $data['title'] ?? '',
                'description' => $data['description'] ?? null,
                'price_usd' => (int) ($data['price_usd'] ?? 0),
                'location' => $data['location'] ?? '',
                'area_sqm' => (int) ($data['area_sqm'] ?? 0),
                'bedrooms' => (int) ($data['bedrooms'] ?? 0),
                'bathrooms' => (int) ($data['bathrooms'] ?? 0),
                'property_type' => $data['property_type'] ?? 'شقة',
                'condition' => $data['condition'] ?? 'جيد',
                'features' => $featuresJson,
                'date_posted' => !empty($data['date_posted']) ? $data['date_posted'] : null,
                'seller_name' => $data['seller_name'] ?? null,
                'seller_phone' => $data['seller_phone'] ?? null,
                'source' => $data['source'] ?? null,
                'ownership_type' => $data['ownership_type'] ?? null,
                'utilities' => $data['utilities'] ?? null,
                'floor' => $data['floor'] ?? null,
                'latitude' => !empty($data['latitude']) ? (float) $data['latitude'] : null,
                'longitude' => !empty($data['longitude']) ? (float) $data['longitude'] : null,
                'price_per_sqm_usd' => (int) ($data['price_per_sqm_usd'] ?? 0),
                'area_class' => $data['area_class'] ?? null,
              'main_image' => '/images/properties/property' . (($count % 10) + 1) . '.jpg',
'gallery_images' => json_encode([
    '/images/properties/property' . (($count % 10) + 1) . '.jpg',
    '/images/properties/property' . (($count + 1) % 10 + 1) . '.jpg',
    '/images/properties/property' . (($count + 2) % 10 + 1) . '.jpg',
    '/images/properties/property' . (($count + 3) % 10 + 1) . '.jpg',
]),
                'is_approved' => true,
                'status' => 'approved',
                'is_featured' => ($count < 8),
                'views_count' => rand(10, 500),
                'owner_id' => $ownerId,
                'furnished' => $furnished,
                'parking' => $parking,
                'elevator' => $elevator,
                'balcony' => $balcony,
                'garden' => $garden,
                'pool' => $pool,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];

            $count++;

            if (count($batch) >= 100) {
                DB::table('properties')->insert($batch);
                $batch = [];
            }

            if ($count % 50 === 0) {
                $ownerId = $ownerId >= 3 ? 2 : $ownerId + 1;
            }
        }

        if (!empty($batch)) {
            DB::table('properties')->insert($batch);
        }

        fclose($handle);
        $this->command->info("Seeded {$count} properties from CSV");
    }

    /**
     * التحقق من وجود ميزة في النص - Check if a feature exists in text
     */
    private function hasFeature(string $text, array $keywords): bool
    {
        foreach ($keywords as $keyword) {
            if (stripos($text, $keyword) !== false) {
                return true;
            }
        }
        return false;
    }
}
