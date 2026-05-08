

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Edit3, Trash2, Eye, Star, Loader2,
  Search, Filter, X, AlertTriangle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatPrice, formatDate, propertyStatusNames, propertyStatusColors, propertyTypeNames } from '../helpers';
import type { Property } from '../types';

export default function OwnerPropertiesPage() {
  const { setShowAddPropertyModal, deleteProperty, updateProperty, addNotification } = useStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'عقاراتي - نظرة';
    loadProperties();
  }, []);

  async function loadProperties() {
    setLoading(true);
    try {
      const token = localStorage.getItem('nazra_token');
      const res = await fetch('/api/owner/properties', {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data.data || data.properties || []);
      }
    } catch {
      addNotification('فشل تحميل العقارات', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProperty(id);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch {
      // handled by store
    }
  }

  async function handleToggleStatus(id: number, newStatus: string) {
    try {
      const token = localStorage.getItem('nazra_token');
      await fetch(`/api/owner/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      addNotification('تم تحديث الحالة', 'success');
      loadProperties();
    } catch {
      addNotification('فشل تحديث الحالة', 'error');
    }
  }

  // فلترة العقارات - Filter properties
  const filtered = properties.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (searchQuery && !p.title.includes(searchQuery) && !p.city.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* الرأس */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nazra-navy flex items-center gap-2">
            <Building2 className="text-nazra-blue" size={24} />
            عقاراتي
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{properties.length} عقار</p>
        </div>
        <button
          onClick={() => setShowAddPropertyModal(true)}
          className="btn-primary text-sm py-2.5 px-4 flex items-center gap-1.5"
        >
          <Plus size={16} />
          إضافة عقار
        </button>
      </div>

      {/* فلاتر */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالعنوان أو المدينة..."
            className="input-field text-sm pr-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-sm w-40"
        >
          <option value="">كل الحالات</option>
          <option value="pending">بانتظار المراجعة</option>
          <option value="approved">معتمد</option>
          <option value="rejected">مرفوض</option>
          <option value="sold">مباع</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-nazra-blue" size={32} />
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((prop, idx) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="card p-4 flex items-center gap-4"
            >
              {/* الصورة */}
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {prop.images?.[0] ? (
                  <img src={prop.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Building2 size={20} />
                  </div>
                )}
              </div>

              {/* المعلومات */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link to={`/property/${prop.id}`} className="font-medium text-gray-800 hover:text-nazra-blue truncate">
                    {prop.title}
                  </Link>
                  <span className={propertyStatusColors[prop.status]}>{propertyStatusNames[prop.status]}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{prop.city}، {prop.neighborhood}</span>
                  <span>{propertyTypeNames[prop.type]}</span>
                  <span className="flex items-center gap-0.5"><Eye size={11} /> {prop.views_count}</span>
                  {prop.average_rating && (
                    <span className="flex items-center gap-0.5"><Star size={11} className="text-nazra-orange" /> {prop.average_rating.toFixed(1)}</span>
                  )}
                </div>
              </div>

              {/* السعر */}
              <div className="text-sm font-bold text-nazra-blue shrink-0">{formatPrice(prop.price)}</div>

              {/* الأزرار */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  to={`/property/${prop.id}`}
                  className="p-2 text-gray-400 hover:text-nazra-blue rounded-lg hover:bg-gray-50"
                  title="عرض"
                >
                  <Eye size={16} />
                </Link>

                {deleteConfirm === prop.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(prop.id)}
                      className="text-xs text-red-600 font-medium px-2 py-1 bg-red-50 rounded"
                    >
                      تأكيد
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-xs text-gray-500 px-2 py-1"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(prop.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-50" />
          <p>لا توجد عقارات</p>
          <button
            onClick={() => setShowAddPropertyModal(true)}
            className="btn-primary text-sm mt-4 py-2 px-5"
          >
            أضف أول عقار
          </button>
        </div>
      )}
    </div>
  );
}
