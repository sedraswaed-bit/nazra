

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Phone, Building2, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cities } from '../helpers';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

type RegisterRole = 'user' | 'owner';

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register, isLoading } = useStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    role: 'user' as RegisterRole,
    city: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // إعادة تعيين - Reset
  useEffect(() => {
    if (!isOpen) {
      setForm({ name: '', email: '', password: '', password_confirmation: '', phone: '', role: 'user', city: '' });
      setErrors({});
    }
  }, [isOpen]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // مسح الخطأ عند الكتابة - Clear error on input
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'الاسم مطلوب';
    if (!form.email.trim()) errs.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'بريد إلكتروني غير صالح';
    if (!form.password) errs.password = 'كلمة المرور مطلوبة';
    else if (form.password.length < 6) errs.password = '6 أحرف على الأقل';
    if (form.password !== form.password_confirmation) errs.password_confirmation = 'كلمتا المرور غير متطابقتين';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        phone: form.phone || undefined,
        role: form.role,
        city: form.city || undefined,
      });
      onClose();
    } catch {
      // الخطأ عبر الإشعارات - Error via notifications
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* زر الإغلاق */}
            <button onClick={onClose} className="absolute top-4 left-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-nazra-navy">إنشاء حساب جديد</h2>
              <p className="text-sm text-gray-500 mt-1">انضم لمنصة نظرة العقارية</p>
            </div>

            {/* اختيار نوع الحساب - Role selection */}
            <div className="flex gap-3 mb-5">
              {([
                { role: 'user' as RegisterRole, label: 'مستخدم', desc: 'بحث واستكشاف', icon: <User size={20} /> },
                { role: 'owner' as RegisterRole, label: 'مالك عقار', desc: 'إضافة وإدارة', icon: <Building2 size={20} /> },
              ]).map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => updateField('role', opt.role)}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                    form.role === opt.role
                      ? 'border-nazra-blue bg-nazra-blue/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`mx-auto mb-1 ${form.role === opt.role ? 'text-nazra-blue' : 'text-gray-400'}`}>
                    {opt.icon}
                  </div>
                  <div className={`text-sm font-medium ${form.role === opt.role ? 'text-nazra-blue' : 'text-gray-600'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-400">{opt.desc}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* الاسم - Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="محمد أحمد"
                    className={`input-field pr-10 ${errors.name ? 'border-red-400' : ''}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
              </div>

              {/* البريد - Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="example@email.com"
                    className={`input-field pr-10 ${errors.email ? 'border-red-400' : ''}`}
                    dir="ltr"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
              </div>

              {/* الهاتف - Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف (اختياري)</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="09XXXXXXXX"
                    className="input-field pr-10"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* المدينة - City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                <select
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">اختر المدينة</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* كلمة المرور - Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-0.5">{errors.password}</p>}
              </div>

              {/* تأكيد كلمة المرور - Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={form.password_confirmation}
                    onChange={(e) => updateField('password_confirmation', e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className={`input-field pr-10 ${errors.password_confirmation ? 'border-red-400' : ''}`}
                  />
                </div>
                {errors.password_confirmation && <p className="text-xs text-red-500 mt-0.5">{errors.password_confirmation}</p>}
              </div>

              {/* زر التسجيل */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  'إنشاء الحساب'
                )}
              </button>
            </form>

            {/* رابط الدخول */}
            <div className="mt-4 text-center text-sm text-gray-500">
              لديك حساب بالفعل؟{' '}
              <button onClick={onSwitchToLogin} className="text-nazra-blue font-medium hover:underline">
                تسجيل الدخول
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
