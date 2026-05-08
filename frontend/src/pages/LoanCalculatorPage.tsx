

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import InvestmentAnalyzer from '../components/InvestmentAnalyzer';
import PriceEstimator from '../components/PriceEstimator';

export default function LoanCalculatorPage() {
  useEffect(() => {
    document.title = 'محلل الاستثمار العقاري - نظرة';
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* الرأس */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-nazra-navy flex items-center gap-2">
              <TrendingUp className="text-emerald-600" size={24} />
              محلل الاستثمار العقاري
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              حلل فرصة الاستثمار وحسّب العائد المتوقع بذكاء
            </p>
          </div>
          <Link
            to="/properties"
            className="flex items-center gap-1 text-sm text-nazra-blue hover:underline"
          >
            <ArrowLeft size={14} />
            تصفح العقارات
          </Link>
        </div>
      </motion.div>

      {/* محتوى الصفحة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* محلل الاستثمار */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InvestmentAnalyzer />
        </motion.div>

        {/* مُقدّر السعر */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PriceEstimator />
        </motion.div>
      </div>

      {/* معلومات توضيحية */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 p-5 bg-emerald-50 rounded-xl border border-emerald-100"
      >
        <div className="flex gap-2.5">
          <TrendingUp className="text-emerald-600 shrink-0 mt-0.5" size={18} />
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">كيف يعمل محلل الاستثمار؟</h3>
            <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
              <li>يحسب العائد السنوي المتوقع بناءً على متوسط إيجارات المنطقة</li>
              <li>يقدّر القيمة المستقبلية للعقار حسب نسبة النمو العقاري</li>
              <li>يقيّم درجة المخاطرة بناءً على موقع العقار ونوعه</li>
              <li>يعطي درجة شاملة لجودة الاستثمار من 0 إلى 100</li>
              <li>البيانات مبنية على تحليل سوق العقارات في دمشق</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
