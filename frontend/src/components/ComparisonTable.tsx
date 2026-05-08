import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bed, Bath, Maximize, MapPin, Home, Calendar, Award, ArrowUpFromLine, Shield, Star, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import axios from 'axios';

// ===== سعر الصرف =====
var EXCHANGE_RATE = 10000;

// ===== تنسيق السعر بالليرة =====
function formatPrice(priceSyp: number): string {
  return new Intl.NumberFormat('ar-SY').format(priceSyp) + ' ل.س';
}

// ===== تنسيق السعر الكامل مع الدولار =====
function formatPriceFull(priceSyp: number): string {
  var usd = Math.round(priceSyp / EXCHANGE_RATE);
  return formatPrice(priceSyp) + ' (~' + new Intl.NumberFormat('en-US').format(usd) + '$)';
}

// ===== أنواع العقارات =====
var PROPERTY_TYPES: Record<string, string> = {
  'شقة': 'شقة',
  'فيلا': 'فيلا',
  'منزل': 'منزل',
  'أرض': 'أرض',
  'مكتب': 'مكتب',
  'محل تجاري': 'محل تجاري',
  'apartment': 'شقة',
  'villa': 'فيلا',
  'house': 'منزل',
  'land': 'أرض',
  'office': 'مكتب',
  'commercial': 'محل تجاري',
};

// ===== حالات العقار =====
var PROPERTY_CONDITIONS: Record<string, string> = {
  'جديد': 'جديد',
  'ممتاز': 'ممتاز',
  'جيد': 'جيد',
  'مقبول': 'مقبول',
  'يحتاج ترميم': 'يحتاج ترميم',
  'new': 'جديد',
  'excellent': 'ممتاز',
  'good': 'جيد',
  'fair': 'مقبول',
  'needs_renovation': 'يحتاج ترميم',
};

// ===== مميزات العقار =====
var PROPERTY_FEATURES: Record<string, string> = {
  'موقف سيارات': 'موقف سيارات',
  'مسبح': 'مسبح',
  'حديقة': 'حديقة',
  'مصعد': 'مصعد',
  'شرفة': 'شرفة',
  'تدفئة': 'تدفئة',
  'مكيف': 'مكيف',
  'أمن': 'أمن',
  'parking': 'موقف سيارات',
  'pool': 'مسبح',
  'garden': 'حديقة',
  'elevator': 'مصعد',
  'balcony': 'شرفة',
  'heating': 'تدفئة',
  'ac': 'مكيف',
  'security': 'أمن',
};

// ===== دالة تحويل features لمصفوفة =====
function parseFeatures(features: any): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  if (typeof features === 'string') {
    try { return JSON.parse(features); } catch(e) { return []; }
  }
  return [];
}

// ===== دالة الحصول على صورة العقار =====
function getPropertyImage(property: any): string {
  if (property.images && property.images.length > 0) {
    return property.images[0];
  }
  return '/placeholder-property.jpg';
}

// ===== دالة تنسيق العنوان =====
function truncateTitle(title: string, maxLen: number): string {
  if (!title) return '';
  if (title.length > maxLen) {
    return title.substring(0, maxLen) + '...';
  }
  return title;
}

export default function ComparisonTable() {
  var navigate = useNavigate();

  // ===== من useStore =====
  var comparisonIds = useStore(function(s) { return s.comparisonIds; });
  var toggleComparison = useStore(function(s) { return s.toggleComparison; });
  var clearComparison = useStore(function(s) { return s.clearComparison; });

  // ===== حالة محلية لتحميل بيانات العقارات =====
  var [compProperties, setCompProperties] = useState<any[]>([]);
  var [isLoadingProps, setIsLoadingProps] = useState(false);

  // ===== تحميل العقارات من API عند تغيير comparisonIds =====
  useEffect(function() {
    if (comparisonIds.length === 0) {
      setCompProperties([]);
      return;
    }

    setIsLoadingProps(true);

    // تحميل كل عقار على حدة من الـ API
    var fetchPromises = comparisonIds.map(function(id) {
      return axios.get('/api/properties/' + id)
        .then(function(res) {
          if (res.data.property) return res.data.property;
          if (res.data.data) return res.data.data;
          return res.data;
        })
        .catch(function(err) {
          console.error('خطأ في تحميل العقار ' + id + ':', err.message);
          return null;
        });
    });

    Promise.all(fetchPromises).then(function(results) {
      var validResults = results.filter(function(r) { return r !== null; });
      setCompProperties(validResults);
      setIsLoadingProps(false);
    });
  }, [comparisonIds]);

  // ===== نستخدم البيانات المحملة =====
  var properties = compProperties;

  // ===== شاشة التحميل =====
  if (isLoadingProps) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted">جاري تحميل بيانات المقارنة...</p>
      </div>
    );
  }

  // ===== إذا لا توجد عقارات =====
  if (properties.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="8" height="12" rx="1" />
            <rect x="14" y="6" width="8" height="12" rx="1" />
            <path d="M6 2v4" />
            <path d="M18 2v4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">لا توجد عقارات للمقارنة</h3>
        <p className="text-sm text-muted max-w-sm mx-auto">
          أضف 2-4 عقارات للمقارنة بينها بالضغط على زر "مقارنة" في أي عقار
        </p>
      </div>
    );
  }

  // ===== إيجاد أفضل القيم =====
  var bestPrice = Math.min.apply(null, properties.map(function(p) { return p.price; }));
  var bestArea = Math.max.apply(null, properties.map(function(p) { return p.area; }));
  var bestBedrooms = Math.max.apply(null, properties.map(function(p) { return p.bedrooms; }));
  var bestBathrooms = Math.max.apply(null, properties.map(function(p) { return p.bathrooms; }));

  var comparisonFields = [
    { key: 'price', label: 'السعر', icon: Star, render: function(p: any) {
      var isBest = p.price === bestPrice;
      return (
        <div className="text-center">
          <p className={"font-bold " + (isBest ? "text-emerald-600" : "text-gold")}>{formatPrice(p.price)}</p>
          <p className="text-xs text-muted mt-0.5">{formatPriceFull(p.price)}</p>
          {isBest && <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">الأفضل</span>}
        </div>
      );
    }},
    { key: 'type', label: 'نوع العقار', icon: Home, render: function(p: any) {
      return <span className="font-medium">{PROPERTY_TYPES[p.type] || p.type}</span>;
    }},
    { key: 'location', label: 'الموقع', icon: MapPin, render: function(p: any) {
      return (
        <div className="flex items-center gap-1 justify-center">
          <MapPin className="w-3 h-3 text-gold flex-shrink-0" />
          <span className="text-sm">{p.neighborhood || p.location}</span>
        </div>
      );
    }},
    { key: 'bedrooms', label: 'غرف النوم', icon: Bed, render: function(p: any) {
      var isBest = p.bedrooms === bestBedrooms;
      return (
        <div className="flex items-center gap-1.5 justify-center">
          <Bed className={"w-4 h-4 " + (isBest ? "text-emerald-500" : "text-gold")} />
          <span className={"font-semibold " + (isBest ? "text-emerald-600" : "")}>{p.bedrooms}</span>
        </div>
      );
    }},
    { key: 'bathrooms', label: 'الحمامات', icon: Bath, render: function(p: any) {
      var isBest = p.bathrooms === bestBathrooms;
      return (
        <div className="flex items-center gap-1.5 justify-center">
          <Bath className={"w-4 h-4 " + (isBest ? "text-emerald-500" : "text-gold")} />
          <span className={"font-semibold " + (isBest ? "text-emerald-600" : "")}>{p.bathrooms}</span>
        </div>
      );
    }},
    { key: 'area', label: 'المساحة', icon: Maximize, render: function(p: any) {
      var isBest = p.area === bestArea;
      return (
        <div className="text-center">
          <div className="flex items-center gap-1.5 justify-center">
            <Maximize className={"w-4 h-4 " + (isBest ? "text-emerald-500" : "text-gold")} />
            <span className={"font-semibold " + (isBest ? "text-emerald-600" : "")}>{p.area}</span>
          </div>
          <span className="text-xs text-muted">م²</span>
          {isBest && <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">الأكبر</span>}
        </div>
      );
    }},
    { key: 'condition', label: 'الحالة', icon: Shield, render: function(p: any) {
      return <span className="font-medium">{PROPERTY_CONDITIONS[p.condition] || p.condition || '-'}</span>;
    }},
    { key: 'year_built', label: 'سنة البناء', icon: Calendar, render: function(p: any) {
      return <span className="font-medium">{p.year_built || '-'}</span>;
    }},
    { key: 'floor', label: 'الطابق', icon: ArrowUpFromLine, render: function(p: any) {
      if (!p.floor) return <span className="text-muted">-</span>;
      var floorText = String(p.floor);
      if (p.total_floors) {
        floorText = String(p.floor) + ' / ' + String(p.total_floors);
      }
      return <span className="font-medium">{floorText}</span>;
    }},
  ];

  // ===== صف المميزات =====
  comparisonFields.push({
    key: 'features',
    label: 'المميزات',
    icon: Sparkles,
    render: function(p: any) {
      var featuresList = parseFeatures(p.features);
      if (featuresList.length === 0) {
        return <span className="text-muted text-xs">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-1 justify-center">
          {featuresList.slice(0, 4).map(function(f: string, i: number) {
            return (
              <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-xs rounded">
                {PROPERTY_FEATURES[f] || f}
              </span>
            );
          })}
          {featuresList.length > 4 && (
            <span className="px-1.5 py-0.5 bg-gray-50 text-muted text-xs rounded">
              +{featuresList.length - 4}
            </span>
          )}
        </div>
      );
    }
  });

  // ===== التوصيات =====
  var cheapestProp = properties.filter(function(p) { return p.price === bestPrice; })[0];
  var largestProp = properties.filter(function(p) { return p.area === bestArea; })[0];
  var mostRoomsProp = properties.filter(function(p) { return p.bedrooms === bestBedrooms; })[0];

  return (
    <div>
      {/* الهيدر - Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <svg className="w-5 h-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="8" height="12" rx="1" />
              <rect x="14" y="6" width="8" height="12" rx="1" />
              <path d="M6 2v4" />
              <path d="M18 2v4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              مقارنة العقارات ({properties.length})
            </h2>
            <p className="text-xs text-muted">الأفضل مميز باللون الأخضر</p>
          </div>
        </div>
        <button
          onClick={function() { clearComparison(); }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <Trash2 className="w-4 h-4" />
          إزالة الكل
        </button>
      </div>

      {/* بطاقات العقارات - Property Cards Row */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(' + properties.length + ', 1fr)' }}>
        {properties.map(function(p) {
          var isCheapest = p.price === bestPrice;
          var imageUrl = getPropertyImage(p);
          return (
            <div
              key={p.id}
              className="glass rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={function() { navigate('/property/' + p.id); }}
            >
              {/* الصورة - Image */}
              <div className="relative h-40 bg-gray-100">
                <img
                  src={imageUrl}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
                {/* زر الإزالة - Remove button */}
                <button
                  onClick={function(e) { e.stopPropagation(); toggleComparison(p.id); }}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted" />
                </button>
                {/* شارات - Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <span className="px-2 py-0.5 bg-gold text-primary text-xs font-bold rounded">
                    {PROPERTY_TYPES[p.type] || p.type}
                  </span>
                  {isCheapest && (
                    <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" />
                      الأوفر
                    </span>
                  )}
                </div>
              </div>
              {/* المعلومات - Info */}
              <div className="p-3">
                <p className="text-sm font-bold text-foreground line-clamp-1 mb-1">{p.title}</p>
                <div className="flex items-center gap-1 text-muted mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs truncate">{p.neighborhood || p.location}</span>
                </div>
                <p className={"text-base font-bold " + (isCheapest ? "text-emerald-600" : "text-gold")}>
                  {formatPrice(p.price)}
                </p>
                <div className="flex items-center gap-3 mt-2 text-muted">
                  <div className="flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    <span className="text-xs">{p.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-3 h-3" />
                    <span className="text-xs">{p.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Maximize className="w-3 h-3" />
                    <span className="text-xs">{p.area} م²</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* جدول المقارنة - Comparison Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-right p-4 text-sm font-bold text-foreground w-36">
                  الخاصية
                </th>
                {properties.map(function(p) {
                  return (
                    <th key={p.id} className="p-4 text-center text-sm font-semibold text-foreground">
                      {truncateTitle(p.title, 20)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map(function(field, idx) {
                var Icon = field.icon;
                return (
                  <tr
                    key={field.key}
                    className={"border-b border-border " + (idx % 2 === 0 ? "bg-white" : "bg-gray-50")}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gold" />
                        <span className="text-sm font-medium text-foreground">{field.label}</span>
                      </div>
                    </td>
                    {properties.map(function(p) {
                      return (
                        <td key={p.id} className="p-4 text-center text-sm text-foreground">
                          {field.render(p)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ملخص التوصية - Recommendation Summary */}
      {properties.length >= 2 && (
        <div className="mt-6 glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="text-sm font-bold text-foreground">ملخص التوصية</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg text-center">
              <Award className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-muted mb-0.5">الأوفر سعراً</p>
              <p className="text-xs font-bold text-emerald-700">
                {truncateTitle(cheapestProp.title, 25)}
              </p>
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">{formatPrice(bestPrice)}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <Maximize className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-muted mb-0.5">الأكبر مساحة</p>
              <p className="text-xs font-bold text-blue-700">
                {truncateTitle(largestProp.title, 25)}
              </p>
              <p className="text-xs text-blue-600 font-semibold mt-0.5">{bestArea} م²</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <Bed className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-muted mb-0.5">الأكثر غرفاً</p>
              <p className="text-xs font-bold text-amber-700">
                {truncateTitle(mostRoomsProp.title, 25)}
              </p>
              <p className="text-xs text-amber-600 font-semibold mt-0.5">{bestBedrooms} غرف</p>
            </div>
          </div>
        </div>
      )}

      {/* زر إضافة المزيد - Add More Button */}
      {properties.length < 4 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            يمكنك إضافة حتى {4 - properties.length} عقار آخر للمقارنة
          </p>
          <p className="text-xs text-muted mt-1">
            اضغط على زر "مقارنة" في أي عقار لإضافته
          </p>
        </div>
      )}
    </div>
  );
}