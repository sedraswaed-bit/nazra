
// 

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, MapPin, Building2, Loader2, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatPrice, propertyTypeNames, neighborhoods } from '../helpers';
import type { SmartSearchResult, PropertyType } from '../types';

var FEATURE_MAP_AR_EN: Record<string, string> = {
  'مفروش': 'furnished',
  'مفروشة': 'furnished',
  'موقف': 'parking',
  'موقف سيارات': 'parking',
  'باركينغ': 'parking',
  'كراج': 'parking',
  'مرآب': 'parking',
  'مصعد': 'elevator',
  'اسانسير': 'elevator',
  'شرفة': 'balcony',
  'بلكونة': 'balcony',
  'بلكون': 'balcony',
  'حديقة': 'garden',
  'بستان': 'garden',
  'مسبح': 'pool',
  'سباحة': 'pool',
  'تدفئة': 'heating',
  'دفاية': 'heating',
  'مكيف': 'ac',
  'تكييف': 'ac',
  'أمن': 'security',
  'حارس': 'security',
};

// 
var QUICK_SEARCH_TYPES: Record<string, string> = {
  'شقة': 'شقة',
  'فيلا': 'فيلا',
  'منزل': 'منزل',
  'مكتب': 'مكتب',
  'محل': 'محل تجاري',
  'أرض': 'أرض',
};

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartSearch({ isOpen, onClose }: SmartSearchProps) {
  const navigate = useNavigate();
  const { smartSearch, smartSearchResults, isAiLoading, setFilters } = useStore();
  const [query, setQuery] = useState('');
  const [activeFeatureFilters, setActiveFeatureFilters] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setActiveFeatureFilters([]);
    }
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Execute search
  async function handleSearch() {
    if (!query.trim() && activeFeatureFilters.length === 0) return;
    
    // بناء استعلام يشمل الفيتشرز المحددة
    var fullQuery = query.trim();
    if (activeFeatureFilters.length > 0) {
      var featurePart = activeFeatureFilters.join(' ');
      fullQuery = fullQuery ? fullQuery + ' ' + featurePart : featurePart;
    }
    
    await smartSearch(fullQuery);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  // Navigate to property
  function goToProperty(id: number) {
    onClose();
    navigate(`/property/${id}`);
  }

  // Apply search filters from interpreted results
  function applyFilters(result: SmartSearchResult) {
    const interpreted = result.interpreted;
    const filters: Record<string, any> = {};
    if (interpreted.type) {
      filters.type = interpreted.type;
    }
    if (interpreted.neighborhood) {
      filters.neighborhood = interpreted.neighborhood;
    }
    if (interpreted.rooms) {
      filters.rooms = String(interpreted.rooms);
    }
    // ⚠️ إصلاح: تطبيق فلاتر الميزات
    var features = getFeatureList(interpreted);
    features.forEach(function(feat) {
      var enKey = FEATURE_MAP_AR_EN[feat] || feat.toLowerCase();
      if (['furnished', 'parking', 'elevator', 'balcony', 'garden', 'pool'].includes(enKey)) {
        filters[enKey] = true;
      }
    });

    setFilters(filters as any);
    onClose();
    navigate('/properties');
  }

  // Toggle feature filter
  function toggleFeatureFilter(feat: string) {
    setActiveFeatureFilters(function(prev) {
      if (prev.includes(feat)) {
        return prev.filter(function(f) { return f !== feat; });
      }
      return prev.concat([feat]);
    });
  }

  // استخراج قائمة الميزات
  function getFeatureList(interpreted: SmartSearchResult['interpreted']): string[] {
    const features: string[] = [];
    if (interpreted.features) {
      if (Array.isArray(interpreted.features)) {
        features.push(...interpreted.features);
      } else if (typeof interpreted.features === 'object') {
        Object.entries(interpreted.features).forEach(([key, val]) => {
          if (val) features.push(key);
        });
      }
    }
    return features;
  }

  // قائمة الميزات المتاحة للفلترة
  var availableFeatures = [
    { key: 'مفروش', label: 'مفروش', icon: '🛋️' },
    { key: 'موقف سيارات', label: 'موقف سيارات', icon: '🅿️' },
    { key: 'مصعد', label: 'مصعد', icon: '🛗' },
    { key: 'شرفة', label: 'شرفة', icon: '🏗️' },
    { key: 'حديقة', label: 'حديقة', icon: '🌳' },
    { key: 'مسبح', label: 'مسبح', icon: '🏊' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[55] flex items-start justify-center pt-[10vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <Sparkles className="text-nazra-orange shrink-0" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ابحث بلغة طبيعية... مثال: شقة في المزة 3 غرف مفروشة مع مصعد"
                className="flex-1 text-sm outline-none placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={isAiLoading || (!query.trim() && activeFeatureFilters.length === 0)}
                className="btn-primary text-sm py-1.5 px-4"
              >
                {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </button>
            </div>

            {/* ⚠️ تحسين: فلتر الميزات السريع */}
            <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50" dir="rtl">
              <div className="flex items-center gap-1.5 mb-2">
                <Filter size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">تصفية حسب الميزات</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableFeatures.map(function(feat) {
                  var isActive = activeFeatureFilters.includes(feat.key);
                  return (
                    <button
                      key={feat.key}
                      onClick={() => toggleFeatureFilter(feat.key)}
                      className={
                        "text-xs px-2.5 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1 " +
                        (isActive
                          ? "bg-nazra-blue text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-nazra-blue hover:text-nazra-blue")
                      }
                    >
                      <span>{feat.icon}</span>
                      <span>{feat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick suggestions */}
            {!smartSearchResults && !isAiLoading && (
              <div className="p-4" dir="rtl">
                <p className="text-xs text-gray-400 mb-2">جرّب هذه البحوث</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'شقة في المزة 3 غرف',
                    'فيلا مع مسبح في كفرسوسة',
                    'مكتب في المالكي مع مصعد',
                    'شقة مفروشة مع موقف سيارات',
                    'منزل بحديقة في أبو رمانة',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); smartSearch(s); }}
                      className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 rounded-full hover:bg-nazra-blue/10 hover:text-nazra-blue transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {isAiLoading && (
              <div className="p-8 text-center">
                <Loader2 className="animate-spin mx-auto text-nazra-blue mb-2" size={28} />
                <p className="text-sm text-gray-500">جاري تحليل البحث بالذكاء الاصطناعي...</p>
              </div>
            )}

            {/* Results */}
            {smartSearchResults && !isAiLoading && (
              <div className="max-h-[50vh] overflow-y-auto">
                {/* Search interpretation */}
                <div className="p-4 bg-nazra-blue/5 border-b border-gray-100" dir="rtl">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-nazra-blue mb-1">
                    <Sparkles size={14} />
                    تفسير البحث
                  </div>
                  <p className="text-sm text-gray-700">{smartSearchResults.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {smartSearchResults.interpreted.type && (
                      <span className="badge-blue text-xs">
                        {propertyTypeNames[smartSearchResults.interpreted.type as PropertyType] || smartSearchResults.interpreted.type}
                      </span>
                    )}
                    {smartSearchResults.interpreted.neighborhood && (
                      <span className="badge-orange text-xs">{smartSearchResults.interpreted.neighborhood}</span>
                    )}
                    {smartSearchResults.interpreted.rooms && (
                      <span className="badge-green text-xs">{smartSearchResults.interpreted.rooms} غرف</span>
                    )}
                    {getFeatureList(smartSearchResults.interpreted).map((feat, i) => (
                      <span key={i} className="badge-blue text-xs">{feat}</span>
                    ))}
                  </div>
                </div>

                {/* Results list */}
                <div className="divide-y divide-gray-50">
                  {smartSearchResults.results.length > 0 ? (
                    smartSearchResults.results.slice(0, 6).map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => goToProperty(prop.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-right"
                        dir="rtl"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          {prop.images?.[0] ? (
                            <img src={prop.images[0]} alt="" className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" fill="%23E2E8F0"><rect width="56" height="56"/><text x="28" y="34" text-anchor="middle" fill="%2394A3B8" font-size="18">🏠</text></svg>');
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Building2 size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{prop.title}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={10} />
                            {prop.city || 'دمشق'}، {prop.neighborhood}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <span>{prop.rooms} غرف</span>
                            <span>•</span>
                            <span>{prop.area} م²</span>
                            {/* عرض الميزات */}
                            {(prop.furnished || prop.parking || prop.elevator || prop.pool) && (
                              <>
                                <span>•</span>
                                <span className="text-nazra-blue">
                                  {[
                                    prop.furnished && 'مفروش',
                                    prop.parking && 'موقف',
                                    prop.elevator && 'مصعد',
                                    prop.pool && 'مسبح',
                                    prop.garden && 'حديقة',
                                    prop.balcony && 'شرفة',
                                  ].filter(Boolean).join(' · ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-nazra-blue shrink-0">
                          {formatPrice(prop.price)}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-sm text-gray-400">
                      لم يتم العثور على نتائج مطابقة
                    </div>
                  )}
                </div>

                {/* View all */}
                {smartSearchResults.results.length > 0 && (
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={() => applyFilters(smartSearchResults)}
                      className="w-full text-sm text-nazra-blue font-medium hover:underline py-1"
                    >
                      عرض كل النتائج ({smartSearchResults.count})
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
