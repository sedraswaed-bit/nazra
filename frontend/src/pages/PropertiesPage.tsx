

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Grid3X3, List, Loader2, Building2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import PropertyCard from '../components/PropertyCard';
import PropertyFilters from '../components/PropertyFilters';
import { formatNumber } from '../helpers';

export default function PropertiesPage() {
  const { properties, totalCount, currentPage, isLoading, filters, fetchProperties, setFilters } = useStore();
  const [searchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // تحميل العقارات - Load properties
  useEffect(() => {
    document.title = 'عقارات - نظرة';
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    if (Object.keys(params).length > 0) {
      setFilters(params as any);
    } else {
      fetchProperties();
    }
  }, []);

  // عدد الصفحات - Total pages
  const perPage = 12;
  const totalPages = Math.ceil(totalCount / perPage);

  function goToPage(page: number) {
    if (page < 1 || page > totalPages) return;
    setFilters({ page });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* الرأس */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nazra-navy">العقارات</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount > 0 ? `${formatNumber(totalCount)} عقار متاح` : 'جاري التحميل...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* زر الفلاتر - Filter button */}
          <button
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-nazra-blue hover:text-nazra-blue transition-colors"
          >
            <SlidersHorizontal size={16} />
            فلاتر
          </button>

          {/* تبديل العرض - View toggle */}
          <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-nazra-blue text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-nazra-blue text-white' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* الفلاتر - Filters sidebar */}
        <PropertyFilters isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />

        {/* المحتوى - Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-nazra-blue" size={32} />
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                  : 'space-y-4'
              }>
                {properties.map((prop, idx) => (
                  <PropertyCard key={prop.id} property={prop} index={idx} />
                ))}
              </div>

              {/* ترقيم الصفحات - Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-8">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="p-2 text-gray-400 hover:text-nazra-blue disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-nazra-blue text-white'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-2 text-gray-400 hover:text-nazra-blue disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Building2 size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-lg">لا توجد عقارات مطابقة</p>
              <p className="text-sm mt-1">جرّب تعديل معايير البحث</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
