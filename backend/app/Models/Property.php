<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'price_usd', 'location', 'area_sqm',
        'bedrooms', 'bathrooms', 'property_type', 'condition',
        'features', 'date_posted', 'seller_name', 'seller_phone',
        'source', 'ownership_type', 'utilities', 'floor',
        'latitude', 'longitude', 'price_per_sqm_usd', 'area_class',
        'main_image', 'gallery_images', 'is_approved', 'is_featured',
        'views_count', 'owner_id', 'status',
        'direction', 'year_built', 'address',
        'ai_price_estimate', 'ai_confidence', 'ai_explanation',
        'furnished', 'parking', 'elevator', 'balcony', 'garden', 'pool',
    ];

    protected $appends = [
        'price', 'area', 'type', 'city', 'neighborhood', 'rooms',
        'featured', 'images', 'price_per_sqm', 'avg_rating',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'is_featured' => 'boolean',
        'date_posted' => 'date',
        'features' => 'array',
        'gallery_images' => 'array',
        'furnished' => 'boolean',
        'parking' => 'boolean',
        'elevator' => 'boolean',
        'balcony' => 'boolean',
        'garden' => 'boolean',
        'pool' => 'boolean',
    ];

    // ========== العلاقات - Relationships ==========

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites')->withTimestamps();
    }

    // ========== الوصولات - Accessors ==========

    public function getPriceAttribute(): int
    {
        return (int) ($this->price_usd * (int) env('EXCHANGE_RATE_SYP', 10000));
    }

    public function getAreaAttribute(): ?float
    {
        return $this->area_sqm ?? 0;
    }

    public function getTypeAttribute(): string
    {
        return $this->property_type ?? 'شقة';
    }

    public function getCityAttribute(): string
    {
        // كل العقارات حالياً في دمشق - All properties currently in Damascus
        return 'دمشق';
    }

    public function getNeighborhoodAttribute(): string
    {
        return $this->location ?? '';
    }

    public function getRoomsAttribute(): int
    {
        return $this->bedrooms ?? 0;
    }

    public function getFeaturedAttribute(): bool
    {
        return $this->is_featured ?? false;
    }

    public function getImagesAttribute(): array
    {
        // إذا كان هناك gallery_images محفوظ، استخدمه
        if ($this->gallery_images && is_array($this->gallery_images) && count($this->gallery_images) > 0) {
            return $this->gallery_images;
        }
        // إذا كان هناك main_image، استخدمه
        if ($this->main_image) {
            return [$this->main_image];
        }
        // صور افتراضية بناءً على رقم العقار
        $imageIndex = (($this->id ?? 1) - 1) % 10 + 1;
        $mainImg = "/images/properties/property{$imageIndex}.jpg";
        $images = [$mainImg];
        for ($i = 1; $i <= 3; $i++) {
            $idx = (($this->id ?? 1) + $i - 1) % 10 + 1;
            $images[] = "/images/properties/property{$idx}.jpg";
        }
        return $images;
    }

    public function getPricePerSqmAttribute(): float
    {
        return ($this->price_per_sqm_usd ?? 0) * (int) env('EXCHANGE_RATE_SYP', 10000);
    }

    public function getAvgRatingAttribute(): float
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    public function getReviewsCountAttribute(): int
    {
        return $this->reviews()->count();
    }

    public function getFormattedPriceAttribute(): string
    {
        $syp = $this->price_usd * (int) env('EXCHANGE_RATE_SYP', 10000);
        if ($syp >= 1000000000) {
            return number_format($syp / 1000000000, 1) . ' مليار ل.س';
        }
        if ($syp >= 1000000) {
            return number_format($syp / 1000000, 0) . ' مليون ل.س';
        }
        return number_format($syp) . ' ل.س';
    }

    // ========== النطاقات - Scopes ==========

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeSold($query)
    {
        return $query->where('status', 'sold');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }
}
