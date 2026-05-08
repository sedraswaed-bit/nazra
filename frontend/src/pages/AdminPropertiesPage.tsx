import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Search, CheckCircle, XCircle, Eye,
  Trash2, Loader2, Clock, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';

// ===== أنواع العقارات =====
var PROPERTY_TYPES: Record<string, string> = {
  'شقة': 'شقة', 'فيلا': 'فيلا', 'منزل': 'منزل',
  'أرض': 'أرض', 'مكتب': 'مكتب', 'محل تجاري': 'محل تجاري',
};

// ===== أسماء الحالات =====
var STATUS_NAMES: Record<string, string> = {
  'pending': 'معلق',
  'approved': 'معتمد',
  'rejected': 'مرفوض',
  'sold': 'مباع',
};

// ===== ألوان الحالات =====
var STATUS_COLORS: Record<string, string> = {
  'pending': 'bg-amber-100 text-amber-700',
  'approved': 'bg-emerald-100 text-emerald-700',
  'rejected': 'bg-red-100 text-red-700',
  'sold': 'bg-gray-100 text-gray-700',
};

// ===== تنسيق السعر =====
function formatPrice(price: number): string {
  var syp = price * 10000;
  if (syp >= 1000000000) return (syp / 1000000000).toFixed(1) + ' مليار ل.س';
  if (syp >= 1000000) return Math.round(syp / 1000000) + ' مليون ل.س';
  return new Intl.NumberFormat('ar-SY').format(syp) + ' ل.س';
}

// ===== تنسيق التاريخ =====
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminPropertiesPage() {
  var addNotification = useStore(function(s) { return s.addNotification; });
  var [properties, setProperties] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [statusFilter, setStatusFilter] = useState('');
  var [searchQuery, setSearchQuery] = useState('');
  var [page, setPage] = useState(1);
  var [totalPages, setTotalPages] = useState(1);
  var [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(function() {
    document.title = 'إدارة العقارات - نظرة';
    loadProperties();
  }, [page, statusFilter]);

  function loadProperties() {
    setLoading(true);
    var token = localStorage.getItem('nazra_token');
    var params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    params.set('page', String(page));

    fetch('/api/admin/properties?' + params.toString(), {
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token },
    })
    .then(function(res) {
      if (res.ok) return res.json();
      throw new Error('Failed');
    })
    .then(function(data) {
      setProperties(data.data || []);
      setTotalPages(data.last_page || 1);
    })
    .catch(function() {
      addNotification('فشل تحميل العقارات', 'error');
    })
    .finally(function() {
      setLoading(false);
    });
  }

  function handleStatusChange(id: number, status: string) {
    setActionLoading(id);
    var token = localStorage.getItem('nazra_token');
    fetch('/api/admin/properties/' + id + '/status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ status: status }),
    })
    .then(function(res) {
      if (!res.ok) throw new Error();
      addNotification(status === 'approved' ? 'تمت الموافقة على العقار' : status === 'rejected' ? 'تم رفض العقار' : 'تم تحديث الحالة', 'success');
      setProperties(properties.map(function(p) { return p.id === id ? Object.assign({}, p, { status: status }) : p; }));
    })
    .catch(function() {
      addNotification('فشل تحديث الحالة', 'error');
    })
    .finally(function() {
      setActionLoading(null);
    });
  }

  function handleDelete(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا العقار؟')) return;
    setActionLoading(id);
    var token = localStorage.getItem('nazra_token');
    fetch('/api/admin/properties/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    })
    .then(function(res) {
      if (!res.ok) throw new Error();
      addNotification('تم حذف العقار', 'success');
      setProperties(properties.filter(function(p) { return p.id !== id; }));
    })
    .catch(function() {
      addNotification('فشل الحذف', 'error');
    })
    .finally(function() {
      setActionLoading(null);
    });
  }

  function handleSearch() {
    setPage(1);
    loadProperties();
  }

  var quickFilters = [
    { value: '', label: 'الكل' },
    { value: 'pending', label: 'معلقة' },
    { value: 'approved', label: 'معتمدة' },
    { value: 'rejected', label: 'مرفوضة' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* الرأس */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nazra-navy flex items-center gap-2">
            <Building2 className="text-nazra-blue" size={24} />
            إدارة العقارات
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">مراجعة وإدارة عقارات المنصة</p>
        </div>
      </div>

      {/* فلاتر */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={function(e) { setSearchQuery(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleSearch(); }}
            placeholder="بحث بالعنوان أو المالك..."
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-nazra-blue w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={function(e) { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-nazra-blue"
        >
          <option value="">كل الحالات</option>
          <option value="pending">بانتظار المراجعة</option>
          <option value="approved">معتمد</option>
          <option value="rejected">مرفوض</option>
          <option value="sold">مباع</option>
        </select>
      </div>

      {/* أزرار فلترة سريعة */}
      <div className="flex gap-2 mb-5">
        {quickFilters.map(function(f) {
          return (
            <button
              key={f.value}
              onClick={function() { setStatusFilter(f.value); setPage(1); }}
              className={"flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors " + (statusFilter === f.value ? "bg-nazra-blue text-white border-nazra-blue" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-nazra-blue")}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-nazra-blue" size={32} />
        </div>
      ) : properties.length > 0 ? (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">العقار</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">المالك</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">النوع</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">الموقع</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">السعر</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">الحالة</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(function(prop) {
                    return (
                      <tr key={prop.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link to={'/property/' + prop.id} className="font-medium text-gray-800 hover:text-nazra-blue">
                            {prop.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{prop.owner ? prop.owner.name : '-'}</td>
                        <td className="py-3 px-4 text-gray-600">{PROPERTY_TYPES[prop.property_type] || prop.property_type}</td>
                        <td className="py-3 px-4 text-gray-600">{prop.location || '-'}</td>
                        <td className="py-3 px-4 text-nazra-blue font-medium">{formatPrice(prop.price_usd || 0)}</td>
                        <td className="py-3 px-4">
                          <span className={"text-xs font-bold px-2 py-1 rounded-full " + (STATUS_COLORS[prop.status] || 'bg-gray-100 text-gray-700')}>{STATUS_NAMES[prop.status] || prop.status}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Link
                              to={'/property/' + prop.id}
                              className="p-1.5 text-gray-400 hover:text-nazra-blue rounded-lg hover:bg-gray-50"
                              title="عرض"
                            >
                              <Eye size={15} />
                            </Link>

                            {prop.status === 'pending' && (
                              <>
                                <button
                                  onClick={function() { handleStatusChange(prop.id, 'approved'); }}
                                  disabled={actionLoading === prop.id}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="موافقة"
                                >
                                  <CheckCircle size={15} />
                                </button>
                                <button
                                  onClick={function() { handleStatusChange(prop.id, 'rejected'); }}
                                  disabled={actionLoading === prop.id}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="رفض"
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}

                            {prop.status === 'approved' && (
                              <button
                                onClick={function() { handleStatusChange(prop.id, 'rejected'); }}
                                disabled={actionLoading === prop.id}
                                className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                                title="سحب الموافقة"
                              >
                                <AlertCircle size={15} />
                              </button>
                            )}

                            <button
                              onClick={function() { handleDelete(prop.id); }}
                              disabled={actionLoading === prop.id}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="حذف"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ترقيم الصفحات */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6">
              <button
                onClick={function() { setPage(Math.max(1, page - 1)); }}
                disabled={page <= 1}
                className="p-2 text-gray-400 hover:text-nazra-blue disabled:opacity-30"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={function() { setPage(Math.min(totalPages, page + 1)); }}
                disabled={page >= totalPages}
                className="p-2 text-gray-400 hover:text-nazra-blue disabled:opacity-30"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-50" />
          <p>لا توجد عقارات مطابقة</p>
        </div>
      )}
    </div>
  );
}