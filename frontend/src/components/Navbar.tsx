

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Building2,
  MessageSquare,
  Shield,
  Heart,
  Plus,
  Search,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import SmartSearch from './SmartSearch';

export default function Navbar() {
  const {
    user,
    isAuthenticated,
    logout,
    setShowLoginModal,
    setShowRegisterModal,
    setShowAddPropertyModal,
  } = useStore();

  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // إغلاق القوائم عند النقر خارجها - Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // إغلاق القائمة المتنقلة عند تغيير المسار - Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/properties', label: 'عقارات' },
    { to: '/map', label: 'خريطة' },
    { to: '/compare', label: 'مقارنة' },
    { to: '/loan-calculator', label: 'حاسبة القروض' },
  ];

  // الروابط حسب الدور - Role-based links
  const getUserLinks = () => {
    if (!user) return [];
    const links = [
      { to: '/profile', label: 'الملف الشخصي', icon: <User size={16} /> },
      { to: `/properties?owner=${user.id}`, label: 'مفضلاتي', icon: <Heart size={16} /> },
    ];
    if (user.role === 'owner' || user.role === 'admin') {
      links.push({
        to: '/owner/dashboard',
        label: 'لوحة التحكم',
        icon: <LayoutDashboard size={16} />,
      });
      links.push({
        to: '/owner/properties',
        label: 'عقاراتي',
        icon: <Building2 size={16} />,
      });
      links.push({
        to: '/owner/messages',
        label: 'الرسائل',
        icon: <MessageSquare size={16} />,
      });
    }
    if (user.role === 'admin') {
      links.push({
        to: '/admin/dashboard',
        label: 'إدارة النظام',
        icon: <Shield size={16} />,
      });
    }
    return links;
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* الشعار - Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-bl from-nazra-blue to-nazra-blue-dark rounded-lg flex items-center justify-center">
              <Building2 className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold text-nazra-navy">نظرة</span>
          </Link>

          {/* روابط التنقل - Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-nazra-blue/10 text-nazra-blue'
                    : 'text-gray-600 hover:text-nazra-blue hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* الجانب الأيمن - Right side actions */}
          <div className="flex items-center gap-2">
            {/* زر البحث - Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-nazra-blue hover:bg-gray-50 rounded-lg transition-colors"
              title="بحث ذكي"
            >
              <Search size={20} />
            </button>

            {isAuthenticated && user ? (
              <>
                {/* زر إضافة عقار - Add property button */}
                {(user.role === 'owner' || user.role === 'admin') && (
                  <button
                    onClick={() => setShowAddPropertyModal(true)}
                    className="hidden sm:flex items-center gap-1.5 btn-primary text-sm py-2 px-4"
                  >
                    <Plus size={16} />
                    <span>أضف عقار</span>
                  </button>
                )}

                {/* قائمة المستخدم - User menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-nazra-blue/10 flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-nazra-blue font-bold text-sm">
                          {user.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
                      >
                        {/* معلومات المستخدم - User info */}
                        <div className="px-4 py-2 border-b border-gray-50">
                          <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>

                        {getUserLinks().map((link) => (
                          <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-nazra-blue transition-colors"
                          >
                            {link.icon}
                            {link.label}
                          </Link>
                        ))}

                        <div className="border-t border-gray-50 mt-1 pt-1">
                          <button
                            onClick={() => {
                              logout();
                              setUserMenuOpen(false);
                            }}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={16} />
                            تسجيل الخروج
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              /* أزرار المصادقة - Auth buttons */
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-nazra-blue transition-colors"
                >
                  تسجيل دخول
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="btn-primary text-sm py-2 px-4"
                >
                  إنشاء حساب
                </button>
              </div>
            )}

            {/* زر القائمة المتنقلة - Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-nazra-blue rounded-lg"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* القائمة المتنقلة - Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-100"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive(link.to)
                      ? 'bg-nazra-blue/10 text-nazra-blue'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <button
                    onClick={() => { setShowLoginModal(true); setMobileOpen(false); }}
                    className="w-full btn-outline text-sm py-2.5"
                  >
                    تسجيل دخول
                  </button>
                  <button
                    onClick={() => { setShowRegisterModal(true); setMobileOpen(false); }}
                    className="w-full btn-primary text-sm py-2.5"
                  >
                    إنشاء حساب
                  </button>
                </div>
              )}

              {isAuthenticated && user && (
                <div className="pt-3 border-t border-gray-100 space-y-1">
                  {getUserLinks().map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => { logout(); setMobileOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut size={16} />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* البحث الذكي - Smart search overlay */}
      <SmartSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}
