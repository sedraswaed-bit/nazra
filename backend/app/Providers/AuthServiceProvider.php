<?php
// مزود خدمة المصادقة / Auth Service Provider

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * تعيينات سياسات النموذج / The model to policy mappings for the application
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * تسجيل خدمات المصادقة والتفويض / Register any authentication / authorization services
     */
    public function boot(): void
    {
        // تعريف بوابة الأدمن / Define admin gate
        Gate::define('admin-access', function ($user) {
            return $user->isAdmin();
        });

        // تعريف بوابة المالك / Define owner gate
        Gate::define('owner-access', function ($user) {
            return $user->isOwner() || $user->isAdmin();
        });
    }
}
