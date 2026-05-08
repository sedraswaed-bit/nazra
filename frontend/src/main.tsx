
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import ComparePage from './pages/ComparePage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import OwnerPropertiesPage from './pages/OwnerPropertiesPage';
import OwnerMessagesPage from './pages/OwnerMessagesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminPropertiesPage from './pages/AdminPropertiesPage';
import LoanCalculatorPage from './pages/LoanCalculatorPage';
import { useStore } from './store/useStore';
import './index.css';

// حارس المسار المحمي - Protected route guard
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, user } = useStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // التحقق من الصلاحية - Check role permission
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// تطبيق التوجيه - Router application
function RouterApp() {
  return (
    <Routes>
      {/* الصفحة الرئيسية - Home */}
      <Route path="/" element={<HomePage />} />

      {/* صفحة العقارات - Properties listing */}
      <Route path="/properties" element={<PropertiesPage />} />

      {/* تفاصيل العقار - Property detail */}
      <Route path="/property/:id" element={<PropertyDetailPage />} />

      {/* المقارنة - Compare */}
      <Route path="/compare" element={<ComparePage />} />

      {/* الخريطة - Map */}
      <Route path="/map" element={<MapPage />} />

      {/* الملف الشخصي - Profile (protected) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* لوحة تحكم المالك - Owner dashboard */}
      <Route
        path="/owner/dashboard"
        element={
          <ProtectedRoute requiredRole="owner">
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/properties"
        element={
          <ProtectedRoute requiredRole="owner">
            <OwnerPropertiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/messages"
        element={
          <ProtectedRoute requiredRole="owner">
            <OwnerMessagesPage />
          </ProtectedRoute>
        }
      />

      {/* لوحة تحكم المدير - Admin dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/properties"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPropertiesPage />
          </ProtectedRoute>
        }
      />

      {/* حاسبة القروض - Loan calculator */}
      <Route path="/loan-calculator" element={<LoanCalculatorPage />} />

      {/* أي مسار آخر - Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// تهيئة التطبيق - Bootstrap app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App>
        <RouterApp />
      </App>
    </BrowserRouter>
  </React.StrictMode>
);
