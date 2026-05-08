

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Notification from './components/Notification';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import AddPropertyModal from './components/AddPropertyModal';

// التمرير للأعلى عند تغيير المسار - Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

interface AppProps {
  children: React.ReactNode;
}

export default function App({ children }: AppProps) {
  const {
    showLoginModal,
    showRegisterModal,
    showAddPropertyModal,
    setShowLoginModal,
    setShowRegisterModal,
    setShowAddPropertyModal,
    fetchFavorites,
    isAuthenticated,
    checkAuth,
  } = useStore();

  // التحقق من المصادقة عند تحميل التطبيق - Check auth on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // تحميل المفضلات عند تسجيل الدخول - Load favorites when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated, fetchFavorites]);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-nazra-bg font-arabic">
      <ScrollToTop />

      {/* شريط التنقل - Navigation bar */}
      <Navbar />

      {/* المحتوى الرئيسي - Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* التذييل - Footer */}
      <Footer />

      {/* الإشعارات - Notifications */}
      <Notification />

      {/* النوافذ المنبثقة - Modals */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}

      {showAddPropertyModal && (
        <AddPropertyModal
          isOpen={showAddPropertyModal}
          onClose={() => setShowAddPropertyModal(false)}
        />
      )}
    </div>
  );
}
