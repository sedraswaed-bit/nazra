

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, Upload, Sparkles, BedDouble, Bath, Maximize2,
  MapPin, Building2, ChevronDown,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  cities, neighborhoods, propertyTypeNames, directions, featureLabels,
} from '../helpers';
import type { PropertyType } from '../types';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPropertyModal({ isOpen, onClose }: AddPropertyModalProps) {
  const { addProperty, estimatePrice, priceEstimate, isAiLoading, addNotification } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // بيانات النموذج - Form data
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    type: 'apartment' as PropertyType,
    city: '',
    neighborhood: '',
    address: '',
    area: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    direction: '',
    year_built: '',
    furnished: false,
    parking: false,
    elevator: false,
    balcony: false,
    garden: false,
    pool: false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // إعادة تعيين - Reset
  useEffect(() => {
    if (!isOpen) {
      setForm({
        title: '', description: '', price: '', type: 'apartment', city: '', neighborhood: '',
        address: '', area: '', rooms: '', bathrooms: '', floor: '', direction: '', year_built: '',
        furnished: false, parking: false, elevator: false, balcony: false, garden: false, pool: false,
      });
      setImages([]);
      setPreviews([]);
      setErrors({});
    }
  }, [isOpen]);

  // الأحياء المتاحة - Available neighborhoods
  const availableHoods = form.city ? (neighborhoods[form.city] || []) : [];

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  }

  // إضافة الصور - Handle images
  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      addNotification('يمكنك رفع 10 صور كحد أقصى', 'error');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(f);
    });
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  // تقدير السعر بالذكاء الاصطناعي - AI price estimate
  function handleAiEstimate() {
    if (!form.city || !form.area || !form.type) {
      addNotification('حدد المدينة والمساحة والنوع للتقدير', 'error');
      return;
    }
    estimatePrice({
      city: form.city,
      neighborhood: form.neighborhood,
      area: Number(form.area),
      rooms: Number(form.rooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      type: form.type,
      furnished: form.furnished,
      parking: form.parking,
      elevator: form.elevator,
    });
  }

  // التحقق - Validate
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'العنوان مطلوب';
    if (!form.price || Number(form.price) <= 0) errs.price = 'السعر مطلوب';
    if (!form.city) errs.city = 'المدينة مطلوبة';
    if (!form.area || Number(form.area) <= 0) errs.area = 'المساحة مطلوبة';
    if (!form.rooms || Number(form.rooms) <= 0) errs.rooms = 'عدد الغرف مطلوب';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // إرسال النموذج - Submit form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description || ' ');
      // ⚠️ إصلاح: تحويل السعر من ليرة سورية لدولار - Convert SYP to USD
      const priceUsd = Math.round(Number(form.price) / 10000);
      fd.append('price_usd', String(priceUsd));
      // ⚠️ إصلاح: اسم الحقل property_type مش type
      fd.append('property_type', form.type);
      // ⚠️ إصلاح: الـ backend يستقبل location مش neighborhood
      fd.append('location', form.neighborhood || form.city);
      fd.append('address', form.address);
      // ⚠️ إصلاح: اسم الحقل area_sqm مش area
      fd.append('area_sqm', form.area);
      // ⚠️ إصلاح: اسم الحقل bedrooms مش rooms
      fd.append('bedrooms', form.rooms);
      fd.append('bathrooms', form.bathrooms || '0');
      if (form.floor) fd.append('floor', form.floor);
      if (form.direction) fd.append('direction', form.direction);
      if (form.year_built) fd.append('year_built', form.year_built);

      // المميزات - Features
      const features = ['furnished', 'parking', 'elevator', 'balcony', 'garden', 'pool'];
      features.forEach((f) => fd.append(f, (form as any)[f] ? '1' : '0'));

      // الصور - Images
      images.forEach((img) => fd.append('gallery_images[]', img));

      await addProperty(fd);
      onClose();
    } catch {
      // handled by store
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-start justify-center z-[60] p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* الرأس */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-nazra-navy">إضافة عقار جديد</h2>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* العنوان والنوع */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">عنوان العقار</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="شقة فاخرة في المزة"
                    className={`input-field ${errors.title ? 'border-red-400' : ''}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
                  <select
                    value={form.type}
                    onChange={(e) => updateField('type', e.target.value)}
                    className="input-field"
                  >
                    {Object.entries(propertyTypeNames).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="وصف تفصيلي للعقار..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {/* السعر + تقدير ذكي */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر (ل.س)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    placeholder="0"
                    className={`input-field flex-1 ${errors.price ? 'border-red-400' : ''}`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleAiEstimate}
                    disabled={isAiLoading}
                    className="btn-outline text-sm py-2 px-3 flex items-center gap-1 whitespace-nowrap"
                  >
                    <Sparkles size={14} />
                    {isAiLoading ? 'جاري...' : 'تقدير ذكي'}
                  </button>
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price}</p>}

                {/* نتيجة التقدير الذكي */}
                {priceEstimate && (
                  <div className="mt-2 p-3 bg-nazra-blue/5 rounded-lg border border-nazra-blue/20">
                    <div className="flex items-center gap-1 text-sm font-medium text-nazra-blue mb-1">
                      <Sparkles size={14} />
                      التقدير الذكي
                    </div>
                    <div className="text-sm text-gray-700">
                      السعر المقدر: <strong>{priceEstimate.estimated_price.toLocaleString('ar-SY')} ل.س</strong>
                    </div>
                    <div className="text-xs text-gray-500">
                      النطاق: {priceEstimate.price_range.min.toLocaleString('ar-SY')} - {priceEstimate.price_range.max.toLocaleString('ar-SY')} ل.س
                      (ثقة {Math.round(priceEstimate.confidence * 100)}%)
                    </div>
                    {priceEstimate.explanation && (
                      <p className="text-xs text-gray-500 mt-1">{priceEstimate.explanation}</p>
                    )}
                  </div>
                )}
              </div>

              {/* الموقع */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                  <select
                    value={form.city}
                    onChange={(e) => { updateField('city', e.target.value); updateField('neighborhood', ''); }}
                    className={`input-field ${errors.city ? 'border-red-400' : ''}`}
                  >
                    <option value="">اختر</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.city && <p className="text-xs text-red-500 mt-0.5">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحي</label>
                  <select
                    value={form.neighborhood}
                    onChange={(e) => updateField('neighborhood', e.target.value)}
                    className="input-field"
                  >
                    <option value="">اختر</option>
                    {availableHoods.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العنوان التفصيلي</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="شارع، قرب..."
                    className="input-field"
                  />
                </div>
              </div>

              {/* المواصفات */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المساحة م²</label>
                  <input
                    type="number"
                    value={form.area}
                    onChange={(e) => updateField('area', e.target.value)}
                    className={`input-field ${errors.area ? 'border-red-400' : ''}`}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الغرف</label>
                  <input
                    type="number"
                    value={form.rooms}
                    onChange={(e) => updateField('rooms', e.target.value)}
                    className={`input-field ${errors.rooms ? 'border-red-400' : ''}`}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحمامات</label>
                  <input
                    type="number"
                    value={form.bathrooms}
                    onChange={(e) => updateField('bathrooms', e.target.value)}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الطابق</label>
                  <input
                    type="number"
                    value={form.floor}
                    onChange={(e) => updateField('floor', e.target.value)}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاتجاه</label>
                  <select
                    value={form.direction}
                    onChange={(e) => updateField('direction', e.target.value)}
                    className="input-field"
                  >
                    <option value="">اختر</option>
                    {directions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* سنة البناء */}
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">سنة البناء</label>
                <input
                  type="number"
                  value={form.year_built}
                  onChange={(e) => updateField('year_built', e.target.value)}
                  placeholder="2020"
                  className="input-field"
                  dir="ltr"
                />
              </div>

              {/* المميزات */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المميزات</label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(featureLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form as any)[key] as boolean}
                        onChange={(e) => updateField(key, e.target.checked)}
                        className="rounded border-gray-300 text-nazra-blue focus:ring-nazra-blue"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* الصور */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الصور (حد أقصى 10)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-nazra-blue hover:bg-nazra-blue/5 transition-colors"
                >
                  <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                  <p className="text-sm text-gray-500">اضغط لرفع الصور أو اسحبها هنا</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG حتى 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImages}
                  className="hidden"
                />

                {/* معاينة الصور - Image previews */}
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* أزرار الإرسال */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 size={18} className="animate-spin" /> جاري الإضافة...</>
                  ) : (
                    'إضافة العقار'
                  )}
                </button>
                <button type="button" onClick={onClose} className="px-6 py-3 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
