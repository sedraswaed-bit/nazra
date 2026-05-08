import { useEffect, useState } from 'react';
import {
  Users, Search, Shield, User, Building2, CheckCircle,
  XCircle, Trash2, Loader2, Filter, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { User as UserType } from '../types';

// ===== تنسيق التاريخ =====
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  var d = new Date(dateStr);
  return d.toLocaleDateString('ar-SY', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== تنسيق العدد =====
function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-SY').format(num);
}

export default function AdminUsersPage() {
  var addNotification = useStore(function(s) { return s.addNotification; });
  var [users, setUsers] = useState<UserType[]>([]);
  var [loading, setLoading] = useState(true);
  var [searchQuery, setSearchQuery] = useState('');
  var [roleFilter, setRoleFilter] = useState('');
  var [page, setPage] = useState(1);
  var [totalPages, setTotalPages] = useState(1);
  var [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(function() {
    document.title = 'إدارة المستخدمين - نظرة';
    loadUsers();
  }, [page, roleFilter]);

  function loadUsers() {
    setLoading(true);
    var token = localStorage.getItem('nazra_token');
    var params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (roleFilter) params.set('role', roleFilter);
    params.set('page', String(page));

    fetch('/api/admin/users?' + params.toString(), {
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + token },
    })
    .then(function(res) {
      if (res.ok) return res.json();
      throw new Error('Failed');
    })
    .then(function(data) {
      setUsers(data.data || []);
      setTotalPages(data.last_page || 1);
    })
    .catch(function() {
      addNotification('فشل تحميل المستخدمين', 'error');
    })
    .finally(function() {
      setLoading(false);
    });
  }

  function handleVerify(userId: number) {
    setActionLoading(userId);
    var token = localStorage.getItem('nazra_token');
    fetch('/api/admin/users/' + userId + '/verify', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token },
    })
    .then(function(res) {
      if (!res.ok) throw new Error();
      addNotification('تم توثيق المستخدم', 'success');
      loadUsers();
    })
    .catch(function() {
      addNotification('فشل التوثيق', 'error');
    })
    .finally(function() {
      setActionLoading(null);
    });
  }

  function handleDelete(userId: number) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    setActionLoading(userId);
    var token = localStorage.getItem('nazra_token');
    fetch('/api/admin/users/' + userId, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    })
    .then(function(res) {
      if (!res.ok) throw new Error();
      addNotification('تم حذف المستخدم', 'success');
      setUsers(users.filter(function(u) { return u.id !== userId; }));
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
    loadUsers();
  }

  var roleNames: Record<string, string> = {
    user: 'مستخدم',
    owner: 'مالك',
    admin: 'مدير',
  };

  var roleColors: Record<string, string> = {
    user: 'bg-blue-100 text-blue-700',
    owner: 'bg-amber-100 text-amber-700',
    admin: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* الرأس */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-nazra-navy flex items-center gap-2">
            <Users className="text-nazra-blue" size={24} />
            إدارة المستخدمين
          </h1>
        </div>
      </div>

      {/* فلاتر */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={function(e) { setSearchQuery(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleSearch(); }}
            placeholder="بحث بالاسم أو البريد..."
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm pr-9 focus:outline-none focus:ring-2 focus:ring-nazra-blue w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={function(e) { setRoleFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-nazra-blue"
        >
          <option value="">كل الأدوار</option>
          <option value="user">مستخدم</option>
          <option value="owner">مالك</option>
          <option value="admin">مدير</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-nazra-blue" size={32} />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">المستخدم</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">البريد</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">الدور</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">المدينة</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">الحالة</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">تاريخ الانضمام</th>
                    <th className="py-3 px-4 text-right text-gray-500 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(function(u) {
                    return (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                              {u.avatar ? (
                                <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <span className="text-nazra-blue text-xs font-bold">{u.name ? u.name.charAt(0) : '?'}</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600" dir="ltr">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={"text-xs font-bold px-2 py-1 rounded-full " + (roleColors[u.role] || 'bg-gray-100 text-gray-700')}>{roleNames[u.role] || u.role}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{u.city || '-'}</td>
                        <td className="py-3 px-4">
                          {u.is_verified ? (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">موثوق</span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">غير موثوق</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500">{formatDate(u.created_at)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {!u.is_verified && u.role === 'owner' && (
                              <button
                                onClick={function() { handleVerify(u.id); }}
                                disabled={actionLoading === u.id}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="توثيق"
                              >
                                <CheckCircle size={15} />
                              </button>
                            )}
                            {u.role !== 'admin' && (
                              <button
                                onClick={function() { handleDelete(u.id); }}
                                disabled={actionLoading === u.id}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="حذف"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
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
              {Array.from({ length: totalPages }, function(_, i) { return i + 1; }).map(function(p) {
                return (
                  <button
                    key={p}
                    onClick={function() { setPage(p); }}
                    className={"w-9 h-9 rounded-lg text-sm " + (page === p ? "bg-nazra-blue text-white" : "text-gray-500 hover:bg-gray-100")}
                  >
                    {p}
                  </button>
                );
              })}
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
      )}
    </div>
  );
}