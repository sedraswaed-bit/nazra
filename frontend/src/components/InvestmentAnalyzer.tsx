

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, BarChart3, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatPrice, formatPricePerSqm, propertyTypeNames } from '../helpers';
import type { PropertyType } from '../types';

// سعر الصرف
var EXCHANGE_RATE = 10000;

// نسب العائد المتوقعة حسب المنطقة
var LOCATION_YIELD: Record<string, number> = {
  'أبو رمانة': 8.5,
  'المالكي': 8.2,
  'النخيل': 7.8,
  'المنارة': 7.5,
  'المزة': 7.2,
  'كفرسوسة': 6.8,
  'الشعلان': 6.5,
  'ماروتا سيتي': 7.0,
  'الروضة': 6.2,
  'العباسين': 6.0,
  'باب توما': 6.5,
  'برزة': 5.5,
  'الميدان': 5.0,
  'ركن الدين': 5.8,
  'دمر': 5.2,
};

// نسبة التضخم العقاري السنوية
var APPRECIATION_RATE: Record<string, number> = {
  'أبو رمانة': 15,
  'المالكي': 14,
  'النخيل': 13,
  'المنارة': 12,
  'المزة': 12,
  'كفرسوسة': 10,
  'الشعلان': 10,
  'ماروتا سيتي': 11,
  'الروضة': 9,
  'العباسين': 9,
  'باب توما': 10,
  'برزة': 8,
  'الميدان': 7,
  'ركن الدين': 8,
  'دمر': 7,
};

// درجة المخاطرة حسب المنطقة
var LOCATION_RISK: Record<string, 'low' | 'medium' | 'high'> = {
  'أبو رمانة': 'low',
  'المالكي': 'low',
  'المزة': 'low',
  'كفرسوسة': 'low',
  'الشعلان': 'low',
  'ماروتا سيتي': 'low',
  'النخيل': 'low',
  'باب توما': 'medium',
  'الروضة': 'medium',
  'العباسين': 'medium',
  'برزة': 'medium',
  'الميدان': 'medium',
  'دمر': 'medium',
  'ركن الدين': 'medium',
};

function getRiskLabel(risk: string): string {
  if (risk === 'low') return 'منخفضة';
  if (risk === 'medium') return 'متوسطة';
  return 'عالية';
}

function getRiskColor(risk: string): string {
  if (risk === 'low') return '#16A34A';
  if (risk === 'medium') return '#D97706';
  return '#DC2626';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'استثمار ممتاز';
  if (score >= 60) return 'استثمار جيد';
  if (score >= 40) return 'استثمار مقبول';
  return 'استثمار محفوف بالمخاطر';
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16A34A';
  if (score >= 60) return '#0077B6';
  if (score >= 40) return '#D97706';
  return '#DC2626';
}

export default function InvestmentAnalyzer() {
  const { estimatePrice, priceEstimate, isAiLoading } = useStore();

  const [location, setLocation] = useState('المزة');
  const [area, setArea] = useState('120');
  const [priceInput, setPriceInput] = useState('');  // سعر الشراء بالليرة
  const [type, setType] = useState<PropertyType>('شقة');
  const [years, setYears] = useState(5);

  // حسابات الاستثمار
  var investment = useMemo(function() {
    var purchasePriceSYP = Number(priceInput) || 0;
    var areaNum = Number(area) || 120;

    // إذا ما في سعر شراء، بنستخدم تقدير AI
    var estimatedSYP = priceEstimate ? priceEstimate.estimated_price : purchasePriceSYP;
    var finalPrice = purchasePriceSYP > 0 ? purchasePriceSYP : estimatedSYP;

    if (finalPrice <= 0) {
      return null;
    }

    // نسبة العائد السنوية
    var yieldRate = LOCATION_YIELD[location] || 6.0;
    var annualRent = finalPrice * (yieldRate / 100);

    // نسبة التضخم العقاري
    var appreciationRate = APPRECIATION_RATE[location] || 8;

    // قيمة العقار بعد N سنوات
    var futureValue = finalPrice * Math.pow(1 + appreciationRate / 100, years);

    // إجمالي الإيجار
    var totalRent = annualRent * years;

    // إجمالي العائد
    var totalReturn = (futureValue - finalPrice) + totalRent;

    // نسبة العائد الإجمالية
    var totalReturnPercent = (totalReturn / finalPrice) * 100;

    // العائد السنوي المتوسط
    var avgAnnualReturn = totalReturnPercent / years;

    // درجة المخاطرة
    var risk = LOCATION_RISK[location] || 'medium';

    // درجة الاستثمار (0-100)
    var score = 0;
    score += Math.min(30, yieldRate * 3);  // العائد حتى 30 نقطة
    score += Math.min(25, appreciationRate * 1.5);  // التضخم حتى 25 نقطة
    score += (risk === 'low' ? 25 : risk === 'medium' ? 15 : 5);  // المخاطرة حتى 25 نقطة
    score += Math.min(20, (areaNum > 100 ? 15 : areaNum > 60 ? 10 : 5));  // المساحة حتى 20 نقطة

    // سعر المتر
    var pricePerSqm = finalPrice / areaNum;

    return {
      purchasePrice: finalPrice,
      annualRent: Math.round(annualRent),
      totalRent: Math.round(totalRent),
      futureValue: Math.round(futureValue),
      capitalGain: Math.round(futureValue - finalPrice),
      totalReturn: Math.round(totalReturn),
      totalReturnPercent: Math.round(totalReturnPercent * 10) / 10,
      avgAnnualReturn: Math.round(avgAnnualReturn * 10) / 10,
      yieldRate: yieldRate,
      appreciationRate: appreciationRate,
      risk: risk,
      score: Math.min(100, Math.round(score)),
      pricePerSqm: Math.round(pricePerSqm),
      years: years,
    };
  }, [priceInput, priceEstimate, location, area, type, years]);

  async function handleAnalyze() {
    // طلب تقدير AI كمرجع
    await estimatePrice({
      city: 'دمشق',
      neighborhood: location,
      area: Number(area),
      rooms: 3,
      bathrooms: 1,
      type: type,
    });
  }

  return (
    <div className="card p-6">
      {/* الرأس */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
          <TrendingUp className="text-emerald-600" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-nazra-navy">محلل الاستثمار العقاري</h3>
          <p className="text-xs text-gray-500">حلل فرصة الاستثمار بذكاء</p>
        </div>
      </div>

      {/* الحقول */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">الحي</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="المزة"
              className="input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">نوع العقار</label>
            <select value={type} onChange={(e) => setType(e.target.value as PropertyType)} className="input-field text-sm">
              {Object.entries(propertyTypeNames).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">المساحة م²</label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="120"
              className="input-field text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">سعر الشراء (ل.س)</label>
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="اتركه فارغاً لتقدير AI"
              className="input-field text-sm"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
            <span>أفق الاستثمار</span>
            <span className="text-emerald-600 text-xs font-normal">{years} سنوات</span>
          </label>
          <input
            type="range"
            min={1}
            max={15}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5">
            <span>سنة</span>
            <span>15 سنة</span>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAiLoading}
          className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2 text-sm"
          style={{ background: '#059669', color: 'white' }}
        >
          {isAiLoading ? (
            <><span className="animate-spin">⏳</span> جاري التحليل...</>
          ) : (
            <><TrendingUp size={16} /> تحليل الاستثمار</>
          )}
        </button>
      </div>

      {/* النتيجة */}
      {investment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-4 bg-gradient-to-bl from-emerald-50 to-blue-50 rounded-xl border border-emerald-100"
        >
          {/* درجة الاستثمار */}
          <div className="text-center mb-4">
            <div className="text-xs text-gray-500 mb-1">درجة الاستثمار</div>
            <div className="text-4xl font-bold" style={{ color: getScoreColor(investment.score) }}>
              {investment.score}
            </div>
            <div className="text-sm font-semibold mt-1" style={{ color: getScoreColor(investment.score) }}>
              {getScoreLabel(investment.score)}
            </div>
          </div>

          {/* شريط الدرجة */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${investment.score}%`, background: getScoreColor(investment.score) }}
            />
          </div>

          {/* مؤشرات رئيسية */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-white/60 rounded-lg text-center">
              <Shield className="mx-auto mb-1" size={18} style={{ color: getRiskColor(investment.risk) }} />
              <div className="text-xs text-gray-500">المخاطرة</div>
              <div className="text-sm font-bold" style={{ color: getRiskColor(investment.risk) }}>{getRiskLabel(investment.risk)}</div>
            </div>
            <div className="p-3 bg-white/60 rounded-lg text-center">
              <Zap className="mx-auto text-amber-500 mb-1" size={18} />
              <div className="text-xs text-gray-500">العائد السنوي</div>
              <div className="text-sm font-bold text-amber-600">{investment.yieldRate}%</div>
            </div>
          </div>

          {/* تفاصيل مالية */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">سعر الشراء</span>
              <span className="font-semibold text-gray-800">{formatPrice(investment.purchasePrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">الإيجار السنوي المتوقع</span>
              <span className="font-semibold text-emerald-600">{formatPrice(investment.annualRent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">إجمالي الإيجار ({years} سنوات)</span>
              <span className="font-semibold text-emerald-600">{formatPrice(investment.totalRent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">القيمة المستقبلية</span>
              <span className="font-semibold text-blue-600">{formatPrice(investment.futureValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ربح رأس المال</span>
              <span className="font-semibold text-blue-600">{formatPrice(investment.capitalGain)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">إجمالي العائد</span>
              <span className="font-bold" style={{ color: getScoreColor(investment.score) }}>{formatPrice(investment.totalReturn)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">نسبة العائد الكلية</span>
              <span className="font-bold" style={{ color: getScoreColor(investment.score) }}>{investment.totalReturnPercent}%</span>
            </div>
          </div>

          {/* مؤشرات إضافية */}
          <div className="flex gap-2 flex-wrap">
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">
              📈 نمو سنوي {investment.appreciationRate}%
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
              💰 عائد {investment.avgAnnualReturn}%/سنة
            </span>
            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">
              📐 {formatPricePerSqm(investment.purchasePrice, Number(area))}/م²
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
