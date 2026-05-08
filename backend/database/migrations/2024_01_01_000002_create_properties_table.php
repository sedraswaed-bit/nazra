<?php
// هجرة جدول العقارات - Properties table migration
// بيانات العقارات المتاحة للبيع والإيجار - Properties data for sale and rent
// منصة نظرة - NAZRA Platform

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('price_usd');
            $table->string('location');
            $table->integer('area_sqm');
            $table->integer('bedrooms')->default(0);
            $table->integer('bathrooms')->default(0);
            $table->string('property_type');
            $table->string('condition')->default('جيد');
            $table->text('features')->nullable();
            $table->date('date_posted')->nullable();
            $table->string('seller_name')->nullable();
            $table->string('seller_phone')->nullable();
            $table->string('source')->nullable();
            $table->string('ownership_type')->nullable();
            $table->text('utilities')->nullable();
            $table->string('floor')->nullable();
            $table->double('latitude', 10, 6)->nullable();
            $table->double('longitude', 10, 6)->nullable();
            $table->integer('price_per_sqm_usd')->default(0);
            $table->string('area_class')->nullable();
            $table->string('main_image')->nullable();
            $table->text('gallery_images')->nullable();
            $table->boolean('is_approved')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->integer('views_count')->default(0);
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();

            // حقول إضافية - Additional fields
            $table->string('status')->default('pending');
            $table->string('direction')->nullable();
            $table->integer('year_built')->nullable();
            $table->string('address')->nullable();
            $table->decimal('ai_price_estimate', 15, 2)->nullable();
            $table->decimal('ai_confidence', 5, 2)->nullable();
            $table->text('ai_explanation')->nullable();

            // المميزات المنطقية - Boolean features
            $table->boolean('furnished')->default(false);
            $table->boolean('parking')->default(false);
            $table->boolean('elevator')->default(false);
            $table->boolean('balcony')->default(false);
            $table->boolean('garden')->default(false);
            $table->boolean('pool')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
