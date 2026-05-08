
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Building2, Eye, Star, MessageSquare,
  TrendingUp, Clock, ArrowLeft, Loader2,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatPrice, formatNumber, formatDate } from '../helpers';
import type { OwnerDashboardStats } from '../types';

// بطاقة إحصائية - Stat card
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-gray-800">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const { user, addNotification } = useStore();
  const [stats, setStats] = useState<OwnerDashboardStats | null>(null);
  const [topProperties, setTopProperties] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'لوحة تحكم المالك - نظرة';
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const token = localStorage.getItem('nazra_token');
      const headers = { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` };

      const [statsRes, propsRes] = await Promise.all([
        fetch('/api/owner/stats', { headers }),
        fetch('/api/owner/properties', { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        const allProps = propsData.data || propsData.properties || [];
        // أعلى العقارات مشاهدة - Top viewed
        setTopProperties(allProps.slice(0, 5));
      }
    } catch {
      addNotification('فشل تحميل لوحة التحكم', 'error');
    } finally {
      setLoading(false);
    }
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
            <LayoutDashboard className="text-nazra-blue" size={24} />
            لوحة التحكم
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">مرحباً {user?.name}</p>
        </div>
        <Link to="/owner/properties" className="flex items-center gap-1 text-sm text-nazra-blue hover:underline">
          <Building2 size={14} />
          إدارة العقارات
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Building2 size={20} className="text-white" />}
          label="إجمالي العقارات"
          value={stats?.total_properties ?? 0}
          color="bg-nazra-blue"
        />
        <StatCard
          icon={<Eye size={20} className="text-white" />}
          label="إجمالي المشاهدات"
          value={formatNumber(stats?.total_views ?? 0)}
          color="bg-nazra-orange"
        />
        <StatCard
          icon={<Star size={20} className="text-white" />}
          label="التقييم المتوسط"
          value={stats?.average_rating ? stats.average_rating.toFixed(1) : '-'}
          color="bg-amber-500"
        />
        <StatCard
          icon={<MessageSquare size={20} className="text-white" />}
          label="رسائل غير مقروءة"
          value={stats?.unread_messages ?? 0}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* أفضل العقارات - Top properties */}
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-nazra-blue" />
            أفضل العقارات مشاهدة
          </h3>
          {topProperties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-right text-gray-500 font-medium">العقار</th>
                    <th className="py-2 text-right text-gray-500 font-medium">المدينة</th>
                    <th className="py-2 text-right text-gray-500 font-medium">السعر</th>
                    <th className="py-2 text-right text-gray-500 font-medium">مشاهدات</th>
                    <th className="py-2 text-right text-gray-500 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {topProperties.map((prop: any) => (
                    <tr key={prop.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5">
                        <Link to={`/property/${prop.id}`} className="text-gray-800 hover:text-nazra-blue font-medium">
                          {prop.title}
                        </Link>
                      </td>
                      <td className="py-2.5 text-gray-600">{prop.city}</td>
                      <td className="py-2.5 text-nazra-blue font-medium">{formatPrice(prop.price)}</td>
                      <td className="py-2.5 text-gray-600">{prop.views_count}</td>
                      <td className="py-2.5">
                        <span className={prop.status === 'approved' ? 'badge-green' : prop.status === 'pending' ? 'badge-orange' : 'badge-red'}>
                          {prop.status === 'approved' ? 'معتمد' : prop.status === 'pending' ? 'معلق' : 'مرفوض'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-6">لا توجد عقارات بعد</p>
          )}
        </div>

        {/* حالة العقارات - Property status */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">حالة العقارات</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">معتمدة</span>
              <span className="badge-green">{stats?.approved_properties ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">بانتظار المراجعة</span>
              <span className="badge-orange">{stats?.pending_properties ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">إجمالي التقييمات</span>
              <span className="badge-blue">{stats?.total_reviews ?? 0}</span>
            </div>
          </div>

          {/* روابط سريعة */}
          <div className="mt-6 space-y-2 pt-4 border-t border-gray-100">
            <Link
              to="/owner/properties"
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600 hover:text-nazra-blue transition-colors"
            >
              <span>إدارة العقارات</span>
              <ArrowLeft size={14} />
            </Link>
            <Link
              to="/owner/messages"
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-600 hover:text-nazra-blue transition-colors"
            >
              <span>الرسائل</span>
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
