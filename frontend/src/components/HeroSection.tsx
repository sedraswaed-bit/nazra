

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Building2, TrendingUp, Users, Sparkles, Loader2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatPrice, propertyTypeNames } from '../helpers';
import type { PropertyType } from '../types';

// - Stats for display
const heroStats = [
  { icon: <Building2 size={22} />, value: '1,500+', label: 'عقار متاح في دمشق' },
  { icon: <MapPin size={22} />, value: '28', label: 'حي بدمشق' },
  { icon: <Users size={22} />, value: '1,200+', label: 'مالك موثوق' },
  { icon: <TrendingUp size={22} />, value: '95%', label: 'دقة التقييم' },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const { smartSearch, smartSearchResults, isAiLoading, setFilters } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<PropertyType | ''>('');
  const [showResults, setShowResults] = useState(false);

  // - AI Smart Search
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setShowResults(true);
    await smartSearch(searchQuery.trim());
  }

  // Enter
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  // 
  function goToProperty(id: number) {
    setShowResults(false);
    setSearchQuery('');
    navigate(`/property/${id}`);
  }

  // 
  function applyFiltersAndGo() {
    if (smartSearchResults) {
      const interpreted = smartSearchResults.interpreted;
      const filters: Record<string, any> = {};
      if (interpreted.type) filters.type = interpreted.type;
      if (interpreted.neighborhood) filters.neighborhood = interpreted.neighborhood;
      if (interpreted.rooms) filters.rooms = String(interpreted.rooms);
      setFilters(filters as any);
    }
    setShowResults(false);
    navigate('/properties');
  }

  // 
  function closeResults() {
    setShowResults(false);
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-bl from-nazra-navy via-nazra-blue to-nazra-blue-dark">
      {/* خلفية مزخرفة - Decorative background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-72 h-72 bg-nazra-orange rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-nazra-blue-light rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full" />
      </div>

      {/* نمط هندسي خفيف */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center">
          {/* العنوان - Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4"
          >
            منصة <span className="text-nazra-orange">نظرة</span> العقارية الذكية
          </motion.h1>

          {/* الوصف - Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto mb-10"
          >
            اكتشف العقارات في سوريا بتقنيات الذكاء الاصطناعي — تقييم أسعار دقيق، بحث ذكي باللغة الطبيعية، ومقارنة شاملة بين العقارات
          </motion.p>

          {/* شريط البحث الذكي - Smart Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto relative"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
              {/* حقل البحث - Search input */}
              <div className="flex-1 relative">
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 text-nazra-orange" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => { if (smartSearchResults) setShowResults(true); }}
                  placeholder="ابحث بلغة طبيعية... مثال: شقة في المزة 3 غرف مفروشة"
                  className="w-full pr-10 pl-3 py-3 bg-white rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-nazra-orange text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setShowResults(false); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* اختيار النوع - Type selector */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as PropertyType | '')}
                className="px-4 py-3 bg-white rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-nazra-orange min-w-[140px]"
              >
                <option value="">كل الأنواع</option>
                {Object.entries(propertyTypeNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>

              {/* زر البحث الذكي - Smart Search button */}
              <button
                onClick={handleSearch}
                disabled={isAiLoading || !searchQuery.trim()}
                className="btn-secondary py-3 px-8 rounded-xl text-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    بحث ذكي
                  </>
                )}
              </button>
            </div>

            {/* نتائج البحث الذكي - Smart Search Results */}
            <AnimatePresence>
              {showResults && (smartSearchResults || isAiLoading) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  {/* تحميل - Loading */}
                  {isAiLoading && (
                    <div className="p-8 text-center">
                      <Loader2 className="animate-spin mx-auto text-nazra-blue mb-2" size={28} />
                      <p className="text-sm text-gray-500">جاري تحليل البحث بالذكاء الاصطناعي...</p>
                    </div>
                  )}

                  {/* تفسير البحث - Search interpretation */}
                  {smartSearchResults && !isAiLoading && (
                    <>
                      <div className="p-4 bg-nazra-blue/5 border-b border-gray-100" dir="rtl">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-nazra-blue mb-1">
                          <Sparkles size={14} />
                          تفسير البحث
                        </div>
                        <p className="text-sm text-gray-700">{smartSearchResults.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {smartSearchResults.interpreted.type && (
                            <span className="bg-nazra-blue/10 text-nazra-blue text-xs px-2 py-1 rounded-full">
                              {propertyTypeNames[smartSearchResults.interpreted.type as PropertyType] || smartSearchResults.interpreted.type}
                            </span>
                          )}
                          {smartSearchResults.interpreted.neighborhood && (
                            <span className="bg-nazra-orange/10 text-nazra-orange text-xs px-2 py-1 rounded-full">
                              {smartSearchResults.interpreted.neighborhood}
                            </span>
                          )}
                          {smartSearchResults.interpreted.rooms && (
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
                              {smartSearchResults.interpreted.rooms} غرف
                            </span>
                          )}
                          {Array.isArray(smartSearchResults.interpreted.features) &&
                            smartSearchResults.interpreted.features.map((feat: string, i: number) => (
                              <span key={i} className="bg-nazra-blue/10 text-nazra-blue text-xs px-2 py-1 rounded-full">
                                {feat}
                              </span>
                            ))}
                        </div>
                      </div>

                      {/* قائمة النتائج - Results list */}
                      <div className="max-h-[40vh] overflow-y-auto divide-y divide-gray-50">
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

                      {/* عرض كل النتائج - View all */}
                      {smartSearchResults.results.length > 0 && (
                        <div className="p-3 border-t border-gray-100">
                          <button
                            onClick={applyFiltersAndGo}
                            className="w-full text-sm text-nazra-blue font-medium hover:underline py-1"
                          >
                            عرض كل النتائج ({smartSearchResults.count})
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* علامات سريعة - Quick tags */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            {['شقة في المزة 3 غرف', 'فيلا مع مسبح في كفرسوسة', 'مكتب في المالكي مع مصعد', 'شقة مفروشة مع موقف سيارات'].map((tag) => (
              <button
                key={tag}
                onClick={() => { setSearchQuery(tag); smartSearch(tag); setShowResults(true); }}
                className="px-3 py-1.5 text-xs text-blue-200 bg-white/10 rounded-full hover:bg-white/20 transition-colors flex items-center gap-1"
              >
                <Sparkles size={10} />
                {tag}
              </button>
            ))}
          </motion.div>
        </div>

        {/* الإحصائيات - Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14"
        >
          {heroStats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10"
            >
              <div className="flex justify-center text-nazra-orange mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-blue-200">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
