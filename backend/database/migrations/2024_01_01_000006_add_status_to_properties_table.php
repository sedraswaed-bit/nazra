<?php
// إضافة حقل الحالة لجدول العقارات - Add status column to properties table
// منصة نظرة - NAZRA Platform

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // تحقق إذا كان العمود موجوداً قبل إضافته - Check if column exists before adding
        if (!Schema::hasColumn('properties', 'status')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->string('status')->default('pending')->after('owner_id');
            });
        }

        // تحديث البيانات الموجودة - Update existing data
        // اللي is_approved = 1 خليهم approved، الباقي pending
        if (Schema::hasColumn('properties', 'status')) {
            \DB::table('properties')->where('is_approved', 1)->update(['status' => 'approved']);
            \DB::table('properties')->where('is_approved', 0)->update(['status' => 'pending']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('properties', 'status')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
