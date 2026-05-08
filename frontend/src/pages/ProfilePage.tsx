

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Shield, Edit3, Save, Loader2, Lock, Key } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cities, formatDate } from '../helpers';

export default function ProfilePage() {
  const { user, setUser, addNotification } = useStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    neighborhood: '',
    bio: '',
  });

  const [pwdForm, setPwdForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  // تحديث النموذج - Update form when user loads
  useEffect(() => {
    document.title = 'الملف الشخصي - نظرة';
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
        neighborhood: user.neighborhood || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem('nazra_token');
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        // معالجة أخطاء التحقق - Handle validation errors
        const msg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'فشل التحديث');
        throw new Error(msg);
      }

      setUser(data.user || { ...user, ...form });
      addNotification('تم تحديث الملف الشخصي', 'success');
      setEditing(false);
    } catch (err: any) {
      addNotification(err.message || 'فشل تحديث الملف', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    if (pwdForm.newPass !== pwdForm.confirm) {
      addNotification('كلمتا المرور غير متطابقتين', 'error');
      return;
    }
    if (pwdForm.newPass.length < 6) {
      addNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
      return;
    }

    try {
      // ⚠️ إصلاح: الـ endpoint الصحيح هو /api/password مش /api/profile/password
      const token = localStorage.getItem('nazra_token');
      const res = await fetch('/api/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: pwdForm.current,
          password: pwdForm.newPass,
          password_confirmation: pwdForm.confirm,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      addNotification('تم تغيير كلمة المرور', 'success');
      setPwdForm({ current: '', newPass: '', confirm: '' });
      setChangingPwd(false);
    } catch (err: any) {
      addNotification(err.message || 'فشل تغيير كلمة المرور', 'error');
    }
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-400">جاري التحميل...</div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-nazra-navy mb-6">الملف الشخصي</h1>

        {/* معلومات المستخدم - User info card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-nazra-blue/10 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-nazra-blue">{user.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">{user.name}</h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge-blue">{user.role === 'admin' ? 'مدير' : user.role === 'owner' ? 'مالك' : 'مستخدم'}</span>
                  {user.is_verified && <span className="badge-green">موثوق ✓</span>}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1 text-sm text-nazra-blue hover:underline"
            >
              <Edit3 size={14} />
              {editing ? 'إلغاء' : 'تعديل'}
            </button>
          </div>

          {editing ? (
            <div className="space-y-4 border-t border-gray-100 pt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="input-field"
                  >
                    <option value="">اختر</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نبذة</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary py-2.5 px-6 flex items-center gap-1.5 text-sm"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400" />
                {user.phone || 'غير محدد'}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                {user.city ? `${user.city}${user.neighborhood ? `، ${user.neighborhood}` : ''}` : 'غير محدد'}
              </div>
              {user.bio && <p className="text-gray-600 mt-2">{user.bio}</p>}
            </div>
          )}
        </div>

        {/* تغيير كلمة المرور - Change password */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Lock size={16} />
              تغيير كلمة المرور
            </h3>
            <button
              onClick={() => setChangingPwd(!changingPwd)}
              className="text-sm text-nazra-blue hover:underline"
            >
              {changingPwd ? 'إلغاء' : 'تغيير'}
            </button>
          </div>

          {changingPwd && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الحالية</label>
                <input
                  type="password"
                  value={pwdForm.current}
                  onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={pwdForm.newPass}
                  onChange={(e) => setPwdForm({ ...pwdForm, newPass: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  className="input-field"
                />
              </div>
              <button onClick={handlePasswordChange} className="btn-primary text-sm py-2 px-5">
                تحديث كلمة المرور
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
