<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'property_id',
        'rating',
        'comment',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * التحقق إذا كان المستخدم قد قيّم العقار مسبقاً - Check if user already reviewed
     */
    public static function hasUserReviewed(int $userId, int $propertyId): bool
    {
        return static::where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->exists();
    }
}
