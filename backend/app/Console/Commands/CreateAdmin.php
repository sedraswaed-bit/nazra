<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdmin extends Command
{
    // أمر الكونسول - Command signature
    protected $signature = 'admin:create {--email=admin@nazra.sy} {--name=Admin} {--password=admin123}';

    // الوصف - Description
    protected $description = 'إنشاء حساب مدير - Create an admin user';

    public function handle()
    {
        $email = $this->option('email');
        $name = $this->option('name');
        $password = $this->option('password');

        // التحقق من عدم وجود الإيميل - Check email doesn't exist
        if (User::where('email', $email)->exists()) {
            $this->error('الإيميل موجود مسبقاً! / Email already exists!');
            return 1;
        }

        // إنشاء الأدمن - Create admin
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'admin',
            'is_verified' => true,
        ]);

        $this->info('تم إنشاء حساب المدير بنجاح! / Admin created successfully!');
        $this->line('');
        $this->line('الإيميل / Email: ' . $email);
        $this->line('كلمة المرور / Password: ' . $password);
        $this->line('');
        $this->warn('غيّر كلمة المرور بعد أول دخول! / Change password after first login!');

        return 0;
    }
}