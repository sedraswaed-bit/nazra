import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Building2, Eye, MessageSquare,
  Clock, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { useStore } from '../store/useStore';

// ===== تنسيق العدد =====
function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SY').format(num);
}

// ===== تنسيق التاريخ =====
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== تنسيق السعر =====
function formatPrice(usd: number): string {
  var syp = usd * 10000;
  if (syp >= 1000000000) return (syp / 1000000000).toFixed(1) + ' مليار';
  if (syp >= 1000000) return Math.round(syp / 1000000) + ' مليون';
  return formatNumber(syp);
}

// ===== بطاقة إحصائية =====
function StatCard(props: { icon: any; label: string; value: string | number; color: string }) {
  var Icon = props.icon;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
      <div className={"w-11 h-11 rounded-lg flex items-center justify-center " + props.color}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <div className="text-xl font-bold text-gray-800">{props.value}</div>
        <div className="text-xs text-gray-500">{props.label}</div>
      </div>
    </div>
  );
}

// ===== أنواع العقارات =====
var PROPERTY_TYPES: Record<string, string> = {
  'شقة': 'شقة', 'فيلا': 'فيلا', 'منزل': 'منزل',
  'أرض': 'أرض', 'مكتب': 'مكتب', 'محل تجاري': 'محل تجاري',
};

export default function AdminDashboardPage() {
  var addNotification = useStore(function(s) { return s.addNotification; });
  var [stats, setStats] = useState<any>(null);
  var [pendingProps, setPendingProps] = useState<any[]>([]);
  var [loading, setLoading] = useState(true);
  var [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(function() {
    document.title = 'لوحة تحكم المدير - نظرة';
    loadDashboard();
  }, []);

  function loadDashboard() {
    var token = localStorage.getItem('nazra_token');
    var headers = { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token };

    Promise.all([
      fetch('/api/admin/dashboard', { headers: headers }).then(function(r) { return r.json(); }).catch(function() { return null; }),
    ])
    .then(function(results) {
      var dashboardData = results[0];
      if (dashboardData) {
        setStats(dashboardData.stats || null);
        setPendingProps(dashboardData.pending_properties || []);
      }
    })
    .catch(function() {
      addNotification('فشل تحميل لوحة التحكم', 'error');
    })
    .finally(function() {
      setLoading(false);
    });
  }

  function handlePropertyAction(id: number, action: string) {
    setActionLoading(id);
    var token = localStorage.getItem('nazra_token');
    var endpoint = '/api/admin/properties/' + id + (action === 'approved' ? '/approve' : '/reject');
    fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
    })
    .then(function(res) {
      if (!res.ok) throw new Error();
      addNotification(action === 'approved' ? 'تمت الموافقة على العقار' : 'تم رفض العقار', action === 'approved' ? 'success' : 'info');
      setPendingProps(pendingProps.filter(function(p) { return p.id !== id; }));
    })
    .catch(function() {
      addNotification('فشل تنفيذ الإجراء', 'error');
    })
    .finally(function() {
      setActionLoading(null);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-nazra-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* الرأس */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nazra-navy flex items-center gap-2">
            <Shield className="text-nazra-blue" size={24} />
            لوحة تحكم المدير
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">نظرة شاملة على حالة المنصة</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/users" className="text-sm text-nazra-blue hover:underline flex items-center gap-1">
            <Users size={14} /> إدارة المستخدمين
          </Link>
          <Link to="/admin/properties" className="text-sm text-nazra-blue hover:underline flex items-center gap-1">
            <Building2 size={14} /> إدارة العقارات
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="إجمالي المستخدمين" value={formatNumber(stats.total_users || 0)} color="bg-nazra-blue" />
          <StatCard icon={Building2} label="إجمالي العقارات" value={formatNumber(stats.total_properties || 0)} color="bg-nazra-orange" />
          <StatCard icon={Eye} label="إجمالي المشاهدات" value={formatNumber(stats.total_views || 0)} color="bg-emerald-500" />
          <StatCard icon={MessageSquare} label="إجمالي الرسائل" value={formatNumber(stats.total_messages || 0)} color="bg-purple-500" />
        </div>
      )}

      {/* حالة العقارات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Clock} label="معلقة" value={stats.pending_properties || 0} color="bg-amber-500" />
          <StatCard icon={CheckCircle} label="معتمدة" value={stats.approved_properties || 0} color="bg-emerald-500" />
          <StatCard icon={XCircle} label="مرفوضة" value={stats.rejected_properties || 0} color="bg-red-500" />
          <StatCard icon={Building2} label="مباعة" value={stats.sold_properties || 0} color="bg-gray-500" />
        </div>
      )}

      {/* عقارات بانتظار المراجعة */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={16} className="text-nazra-orange" />
            عقارات بانتظار المراجعة ({pendingProps.length})
          </h3>
          <Link to="/admin/properties" className="text-sm text-nazra-blue hover:underline">عرض الكل</Link>
        </div>

        {pendingProps.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 text-right text-gray-500 font-medium">العقار</th>
                  <th className="py-2 text-right text-gray-500 font-medium">المالك</th>
                  <th className="py-2 text-right text-gray-500 font-medium">النوع</th>
                  <th className="py-2 text-right text-gray-500 font-medium">السعر</th>
                  <th className="py-2 text-right text-gray-500 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {pendingProps.slice(0, 10).map(function(prop) {
                  return (
                    <tr key={prop.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5">
                        <Link to={'/property/' + prop.id} className="text-gray-800 hover:text-nazra-blue font-medium">
                          {prop.title}
                        </Link>
                      </td>
                      <td className="py-2.5 text-gray-600">{prop.owner ? prop.owner.name : '-'}</td>
                      <td className="py-2.5 text-gray-600">{PROPERTY_TYPES[prop.property_type] || prop.property_type}</td>
                      <td className="py-2.5 text-nazra-blue font-medium">{formatPrice(prop.price_usd || 0)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={function() { handlePropertyAction(prop.id, 'approved'); }}
                            disabled={actionLoading === prop.id}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="موافقة"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={function() { handlePropertyAction(prop.id, 'rejected'); }}
                            disabled={actionLoading === prop.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="رفض"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-6 text-gray-400">لا توجد عقارات معلقة</p>
        )}
      </div>
    </div>
  );
}