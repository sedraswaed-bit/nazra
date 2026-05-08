<?php
// البيانات التجريبية - Database Seeder
// إضافة بيانات تجريبية للاختبار - Add sample data for testing
// منصة نظرة - NAZRA Platform



namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            PropertySeeder::class,
        ]);
    }
}