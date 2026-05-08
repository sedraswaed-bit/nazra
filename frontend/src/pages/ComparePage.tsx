

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompare, ArrowLeft, Loader2, Building2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import ComparisonTable from '../components/ComparisonTable';
import type { Property } from '../types';

export default function ComparePage() {
  var store = useStore();
  var comparisonIds = store.comparisonIds;
  var properties = store.properties;
  var toggleComparison = store.toggleComparison;
  var clearComparison = store.clearComparison;
  var comparePropsState = useState<Property[]>([]);
  var compareProps = comparePropsState[0];
  var setCompareProps = comparePropsState[1];
  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  useEffect(function() {
    document.title = 'مقارنة العقارات - نظرة';
  }, []);

  useEffect(function() {
    async function loadCompareProps() {
      if (comparisonIds.length === 0) {
        setCompareProps([]);
        return;
      }
      setLoading(true);
      var loaded: Property[] = [];

      for (var i = 0; i < comparisonIds.length; i++) {
        var id = comparisonIds[i];
        // ⚠️ إصلاح: البحث في properties المحملة أولاً، ثم API
        var cached = properties.find(function(p) { return p.id === id; });
        if (cached) {
          loaded.push(cached);
        } else {
          try {
            var res = await fetch('/api/properties/' + id);
            var data = await res.json();
            // ⚠️ إصلاح: التحقق من صيغة البيانات
            if (data.property) loaded.push(data.property);
            else if (data.data) loaded.push(data.data);
          } catch(e) {
            // تجاهل العقارات المحذوفة
          }
        }
      }

      setCompareProps(loaded);
      setLoading(false);
    }

    loadCompareProps();
  }, [comparisonIds, properties]);

  function handleRemove(id: number) {
    toggleComparison(id);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nazra-navy flex items-center gap-2">
            <GitCompare className="text-nazra-blue" size={24} />
            مقارنة العقارات
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {'قارن بين ' + compareProps.length + ' عقار (حد أقصى 4)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {compareProps.length > 0 && (
            <button
              onClick={clearComparison}
              className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
            >
              <X size={14} />
              إزالة الكل
            </button>
          )}
          <Link
            to="/properties"
            className="flex items-center gap-1 text-sm text-nazra-blue font-medium hover:underline"
          >
            <Building2 size={14} />
            أضف عقارات للمقارنة
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-nazra-blue" size={32} />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* ⚠️ إصلاح: تمرير البيانات و onRemove بشكل صحيح */}
          <ComparisonTable properties={compareProps} onRemove={handleRemove} />
        </motion.div>
      )}

      {compareProps.length > 0 && compareProps.length < 4 && (
        <div className="mt-8 text-center">
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-5 py-2 bg-nazra-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Building2 size={15} />
            أضف المزيد من العقارات للمقارنة
          </Link>
        </div>
      )}
    </div>
  );
}
