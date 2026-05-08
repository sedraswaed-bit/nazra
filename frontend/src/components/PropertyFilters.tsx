import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, RotateCcw, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { SearchFilters } from '../types';

var EXCHANGE_RATE = 10000;

var DAMASCUS_NEIGHBORHOODS = [
  'إربين', 'أبو رمانة', 'باب توما', 'برزة', 'داريا', 
  'دوما', 'دمر', 'زملكا', 'سقبا', 'شاغور', 
  'صحنايا', 'ضواحي قدسيا', 'عربين', 'قدسيا', 'كفرسوسة',
  'مشروع دمر', 'المالكي', 'المزة', 'الميدان', 'المنارة',
  'النخيل', 'الشعلان', 'القصاع', 'القنوات', 'المدينة القديمة',
  'الحمراء', 'حرستا', 'ماروتا سيتي', 'دمر البلد',
  'الحلبوني', 'البحصة', 'الروضة', 'العباسين', 'القصور',
  'ركن الدين', 'سومرية', 'جوبر', 'الصحفي', 'اليرموك',
].sort(function(a, b) { return a.localeCompare(b, 'ar'); });

var PROPERTY_TYPES = [
  { value: 'شقة', label: 'شقة' },
  { value: 'فيلا', label: 'فيلا' },
  { value: 'منزل', label: 'منزل' },
  { value: 'أرض', label: 'أرض' },
  { value: 'مكتب', label: 'مكتب' },
  { value: 'محل تجاري', label: 'محل تجاري' },
];

var SORT_OPTIONS = [
  { value: 'created_at|desc', label: 'الأحدث' },
  { value: 'price_usd|asc', label: 'السعر: من الأقل' },
  { value: 'price_usd|desc', label: 'السعر: من الأعلى' },
  { value: 'area_sqm|desc', label: 'المساحة: الأكبر' },
  { value: 'views_count|desc', label: 'الأكثر مشاهدة' },
];

function CustomSelect(props: {
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  var openState = useState(false);
  var isOpen = openState[0];
  var setOpen = openState[1];
  var ref = useRef<HTMLDivElement>(null);

  useEffect(function () {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return function () { document.removeEventListener('mousedown', handleClick); };
  }, []);

  var selected = props.options.find(function (o) { return o.value === props.value; });
  var selectedLabel = selected ? selected.label : props.placeholder;

  function getChevronClass() {
    var base = 'w-4 h-4 text-gray-400 transition-transform';
    if (isOpen) return base + ' rotate-180';
    return base;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={function () { setOpen(!isOpen); }}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 flex items-center justify-between hover:border-blue-600 transition-colors"
      >
        <span className={props.value ? 'text-gray-900' : 'text-gray-400'}>{selectedLabel}</span>
        <ChevronDown className={getChevronClass()} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {props.options.map(function (option) {
              var isSelected = option.value === props.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={function () {
                    props.onChange(option.value);
                    setOpen(false);
                  }}
                  className={isSelected
                    ? 'w-full text-right px-3 py-2 text-sm bg-blue-600 text-white font-medium'
                    : 'w-full text-right px-3 py-2 text-sm text-gray-900 hover:bg-gray-50'
                  }
                >
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PropertyFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyFilters(props: PropertyFiltersProps) {
  var store = useStore();
  var filters = store.filters;
  var setFilters = store.setFilters;
  var clearFilters = store.clearFilters;

  function updateFilter(key: string, value: any) {
    if (value !== null && value !== undefined && value !== '' && value !== false) {
      setFilters({ [key]: value } as Partial<SearchFilters>);
    } else {
      setFilters({ [key]: null } as any);
    }
  }

  function handleSortChange(val: string) {
    var parts = val.split('|');
    var sortBy = parts[0] || 'created_at';
    var sortDir = parts[1] || 'desc';
    setFilters({ sort_by: sortBy, sort_dir: sortDir } as Partial<SearchFilters>);
  }

  function handleReset() {
    clearFilters();
  }

  var currentSortValue = (filters.sort_by || 'created_at') + '|' + (filters.sort_dir || 'desc');

  var locationOptions = [{ value: '', label: 'جميع الأحياء' }].concat(
    DAMASCUS_NEIGHBORHOODS.map(function (name) { return { value: name, label: name }; })
  );

  return (
    <>
      <AnimatePresence>
        {props.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={props.onClose}
            className="lg:hidden fixed inset-0 z-40 bg-black/30"
          />
        )}
      </AnimatePresence>

      <div className={
        props.isOpen
          ? 'fixed lg:static inset-y-0 right-0 z-50 w-80 lg:w-72 lg:z-auto bg-white lg:bg-transparent shadow-xl lg:shadow-none overflow-y-auto lg:overflow-visible transform translate-x-0 transition-transform'
          : 'hidden lg:block w-72 shrink-0'
      }>
        <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-20 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              تصفية
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                إعادة تعيين
              </button>
              <button onClick={props.onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">الموقع</label>
              <CustomSelect
                value={filters.neighborhood || ''}
                onChange={function (val) { updateFilter('neighborhood', val); }}
                options={locationOptions}
                placeholder="جميع الأحياء"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">نوع العقار</label>
              <CustomSelect
                value={filters.type || ''}
                onChange={function (val) { updateFilter('type', val); }}
                options={PROPERTY_TYPES}
                placeholder="جميع الأنواع"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">نطاق السعر (مليون ل.س)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="من"
                  value={filters.price_min ? Math.round((filters.price_min * EXCHANGE_RATE) / 1000000) : ''}
                  onChange={function (e) {
                    var val = e.target.value;
                    updateFilter('price_min', val ? Number(val) * 1000000 / EXCHANGE_RATE : '');
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                />
                <input
                  type="number"
                  placeholder="إلى"
                  value={filters.price_max ? Math.round((filters.price_max * EXCHANGE_RATE) / 1000000) : ''}
                  onChange={function (e) {
                    var val = e.target.value;
                    updateFilter('price_max', val ? Number(val) * 1000000 / EXCHANGE_RATE : '');
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">غرف النوم</label>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4, 5].map(function (n) {
                  var isActive = n === 0 ? !filters.rooms : filters.rooms === n;
                  return (
                    <button
                      key={n}
                      onClick={function () { updateFilter('rooms', n === 0 ? null : n); }}
                      className={isActive
                        ? 'flex-1 py-2 text-xs rounded-lg bg-blue-600 text-white font-bold'
                        : 'flex-1 py-2 text-xs rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }
                    >
                      {n === 0 ? 'الكل' : n === 5 ? '5+' : n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">ميزات</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'parking', label: 'موقف سيارات' },
                  { key: 'elevator', label: 'مصعد' },
                  { key: 'balcony', label: 'شرفة' },
                  { key: 'garden', label: 'حديقة' },
                  { key: 'pool', label: 'مسبح' },
                  { key: 'furnished', label: 'مفروش' },
                ].map(function (feat) {
                  var isActive = (filters as any)[feat.key] === true;
                  return (
                    <button
                      key={feat.key}
                      onClick={function () { updateFilter(feat.key, isActive ? null : true); }}
                      className={isActive
                        ? 'px-3 py-1.5 text-xs rounded-full bg-blue-600 text-white font-medium'
                        : 'px-3 py-1.5 text-xs rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100'
                      }
                    >
                      {feat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">ترتيب</label>
              <CustomSelect
                value={currentSortValue}
                onChange={handleSortChange}
                options={SORT_OPTIONS}
                placeholder="الأحدث"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}