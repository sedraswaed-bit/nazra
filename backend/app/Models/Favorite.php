<?php
// نموذج المفضلة - Favorite Model
// يتحكم بعقارات المستخدم المفضلة - Manages user's favorite properties
// منصة نظرة - NAZRA Platform

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'property_id',
    ];

    // العلاقات - Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }
}
