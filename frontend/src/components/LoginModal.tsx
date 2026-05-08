

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { login, isLoading } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // إعادة تعيين النموذج - Reset form
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setErrors({});
    }
  }, [isOpen]);

  // التحقق من المدخلات - Validate inputs
  function validate(): boolean {
    const errs: typeof errors = {};
    if (!email.trim()) {
      errs.email = 'البريد الإلكتروني مطلوب';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'بريد إلكتروني غير صالح';
    }
    if (!password) {
      errs.password = 'كلمة المرور مطلوبة';
    } else if (password.length < 6) {
      errs.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(email, password);
      onClose();
    } catch {
      // الخطأ يُعرض عبر الإشعارات - Error shown via notifications
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* زر الإغلاق - Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={20} />
            </button>

            {/* العنوان - Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-nazra-navy">تسجيل الدخول</h2>
              <p className="text-sm text-gray-500 mt-1">أدخل بياناتك للوصول لحسابك</p>
            </div>

            {/* النموذج - Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* البريد الإلكتروني - Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className={`input-field pr-10 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                    dir="ltr"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* كلمة المرور - Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`input-field pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                    autoComplete="current-password"
                  />
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* زر تسجيل الدخول - Login button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>

            {/* رابط التسجيل - Register link */}
            <div className="mt-5 text-center text-sm text-gray-500">
              ليس لديك حساب؟{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-nazra-blue font-medium hover:underline"
              >
                إنشاء حساب جديد
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
