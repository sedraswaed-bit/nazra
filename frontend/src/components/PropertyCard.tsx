

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  BedDouble,
  Bath,
  Maximize2,
  MapPin,
  Eye,
  Star,
  GitCompare,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  formatPrice,
  formatPriceShort,
  formatArea,
  propertyTypeNames,
  priceToUsd,
} from '../helpers';
import type { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const { toggleFavorite, isFavorite, toggleComparison, comparisonIds, isAuthenticated } = useStore();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fav = isFavorite(property.id);
  const inCompare = comparisonIds.includes(property.id);

  // صورة افتراضية - Default image placeholder
  const defaultImg = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="#e2e8f0"><rect width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="18" font-family="sans-serif">صورة العقار</text></svg>`
  )}`;

  const displayImg = property.images?.[0]
    ? (imgError ? defaultImg : property.images[0])
    : defaultImg;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="card group overflow-hidden"
    >
      {/* صورة العقار - Property image */}
      <Link to={`/property/${property.id}`} className="block relative overflow-hidden aspect-[4/3]">
        <img
          src={displayImg}
          alt={property.title}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* شارة النوع - Type badge */}
        <span className="absolute top-3 right-3 badge-blue text-xs">
          {propertyTypeNames[property.type]}
        </span>

        {/* شارة مميز - Featured badge */}
        {property.featured && (
          <span className="absolute top-3 left-3 bg-nazra-orange text-white text-xs px-2 py-1 rounded-full font-medium">
            مميز
          </span>
        )}

        {/* تراكب تدرجي - Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />
      </Link>
      {/* أزرار سريعة - Quick actions */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 transition-opacity">
        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite(property.id); }}
          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
            fav ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:text-red-500'
          }`}
          title={fav ? 'إزالة من المفضلة' : 'أضف للمفضلة'}
        >
          <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={(e) => { e.preventDefault(); toggleComparison(property.id); }}
          className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
            inCompare ? 'bg-nazra-blue text-white' : 'bg-white/80 text-gray-600 hover:text-nazra-blue'
          }`}
          title={inCompare ? 'إزالة من المقارنة' : 'أضف للمقارنة'}
        >
          <GitCompare size={16} />
        </button>
      </div>

      {/* محتوى البطاقة - Card body */}
      <div className="p-4">
        {/* السعر - Price */}
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-lg font-bold text-nazra-blue">
            {formatPrice(property.price)}
          </span>
          <span className="text-xs text-gray-400">
            {priceToUsd(property.price)}
          </span>
        </div>

        {/* العنوان - Title */}
        <Link to={`/property/${property.id}`}>
          <h3 className="text-sm font-semibold text-gray-800 hover:text-nazra-blue transition-colors line-clamp-1 mb-1.5">
            {property.title}
          </h3>
        </Link>

        {/* الموقع - Location */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin size={12} />
          <span>{property.city}، {property.neighborhood}</span>
        </div>

        {/* المواصفات - Specs */}
        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
          {property.rooms > 0 && (
            <div className="flex items-center gap-1">
              <BedDouble size={14} />
              <span>{property.rooms} غرف</span>
            </div>
          )}
          {property.bathrooms > 0 && (
            <div className="flex items-center gap-1">
              <Bath size={14} />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize2 size={14} />
            <span>{formatArea(property.area)}</span>
          </div>
        </div>

        {/* التقييم والمشاهدات - Rating & views */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
          {property.average_rating ? (
            <div className="flex items-center gap-1">
              <Star size={13} className="text-nazra-orange" fill="currentColor" />
              <span className="text-xs font-medium text-gray-700">
                {property.average_rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-300">لا تقييم</span>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye size={13} />
            <span>{property.views_count}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
