<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'مدير المنصة',
            'email' => 'admin@nazra.sy',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'phone' => '0999999999',
            'is_verified' => true,
        ]);

        User::create([
            'name' => 'أحمد المالكي',
            'email' => 'owner@nazra.sy',
            'password' => Hash::make('owner123'),
            'role' => 'owner',
            'phone' => '0988888888',
            'is_verified' => true,
            'neighborhood' => 'المالكي',
        ]);

        User::create([
            'name' => 'محمد المستخدم',
            'email' => 'user@nazra.sy',
            'password' => Hash::make('user123'),
            'role' => 'user',
            'phone' => '0977777777',
        ]);
    }
}