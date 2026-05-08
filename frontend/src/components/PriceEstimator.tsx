

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Info, Loader2, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { neighborhoods, propertyTypeNames, formatPrice, formatPricePerSqm } from '../helpers';
import type { PropertyType, PriceEstimate } from '../types';

export default function PriceEstimator() {
  const { estimatePrice, priceEstimate, isAiLoading } = useStore();

  const [city, setCity] = useState('دمشق');
  const [neighborhood, setNeighborhood] = useState('المزة');
  const [area, setArea] = useState('120');
  const [rooms, setRooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('1');
  const [type, setType] = useState<PropertyType>('شقة');

  async function handleEstimate() {
    if (!neighborhood || !area) return;
    await estimatePrice({
      city: city,
      neighborhood: neighborhood,
      area: Number(area),
      rooms: Number(rooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      type: type,
    });
  }

  // أحياء دمشق
  var damascusHoods = neighborhoods['دمشق'] || [];

  return (
    <div className="card p-6">
      {/* الرأس */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-10 h-10 bg-nazra-orange/10 rounded-lg flex items-center justify-center">
          <Sparkles className="text-nazra-orange" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-nazra-navy">مُقدّر السعر الذكي</h3>
          <p className="text-xs text-gray-500">تقييم مبدئي مدعوم بالذكاء الاصطناعي</p>
        </div>
      </div>

      {/* الحقول */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">المدينة</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="input-field text-sm">
              <option value="دمشق">دمشق</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">الحي</label>
            <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="input-field text-sm">
              {damascusHoods.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
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
            <label className="block text-xs font-medium text-gray-600 mb-1">الغرف</label>
            <input
              type="number"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              placeholder="3"
              className="input-field text-sm"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">النوع</label>
            <select value={type} onChange={(e) => setType(e.target.value as PropertyType)} className="input-field text-sm">
              {Object.entries(propertyTypeNames).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleEstimate}
          disabled={isAiLoading || !neighborhood || !area}
          className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2 text-sm"
        >
          {isAiLoading ? (
            <><Loader2 size={16} className="animate-spin" /> جاري التقدير...</>
          ) : (
            <><Sparkles size={16} /> تقدير السعر</>
          )}
        </button>
      </div>

      {/* النتيجة */}
      {priceEstimate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-4 bg-gradient-to-bl from-nazra-blue/5 to-nazra-orange/5 rounded-xl border border-nazra-blue/10"
        >
          {/* السعر المقدر */}
          <div className="text-center mb-3">
            <div className="text-xs text-gray-500 mb-1">السعر المقدر</div>
            <div className="text-2xl font-bold text-nazra-blue">
              {formatPrice(priceEstimate.estimated_price)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              ≈ ${priceEstimate.price_usd?.toLocaleString() || '0'} (سعر الصرف: {priceEstimate.exchange_rate?.toLocaleString() || '10,000'})
            </div>
          </div>

          {/* نطاق السعر */}
          <div className="flex items-center justify-between text-sm mb-3 px-2">
            <div>
              <span className="text-xs text-gray-400">الحد الأدنى</span>
              <div className="font-semibold text-gray-700">{formatPrice(priceEstimate.price_range.min)}</div>
            </div>
            <ArrowRight className="text-gray-300" size={16} />
            <div className="text-left">
              <span className="text-xs text-gray-400">الحد الأقصى</span>
              <div className="font-semibold text-gray-700">{formatPrice(priceEstimate.price_range.max)}</div>
            </div>
          </div>

          {/* نسبة الثقة */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">نسبة الثقة</span>
              <span className="font-medium text-nazra-blue">{Math.round((priceEstimate.confidence || 0) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-l from-nazra-blue to-nazra-blue-light h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((priceEstimate.confidence || 0) * 100)}%` }}
              />
            </div>
          </div>

          {/* سعر المتر */}
          <div className="text-center text-sm text-gray-600 mb-3">
            سعر المتر: <strong>{formatPricePerSqm(priceEstimate.estimated_price, Number(area))}</strong>
          </div>

          {/* الشرح */}
          {priceEstimate.explanation && (
            <div className="flex gap-2 p-2.5 bg-white/60 rounded-lg">
              <Info className="text-nazra-blue shrink-0 mt-0.5" size={14} />
              <p className="text-xs text-gray-600 leading-relaxed">{priceEstimate.explanation}</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
