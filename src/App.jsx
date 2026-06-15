import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

import Dashboard from './pages/Dashboard';
import ImageProcess from './pages/ImageProcess';
import History from './pages/History';
import AdminLog from './pages/AdminLog';
import ModelManager from './pages/ModelManager';
import Login from './pages/Auth/Login';
import Register from './pages/Register';

// Guard: chưa login thì về /login
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// Guard: đã login thì không vào /login nữa
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      </Route>

      {/* App pages — yêu cầu đăng nhập */}
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/"               element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/process"        element={<ImageProcess />} />
        <Route path="/history"        element={<History />} />
        <Route path="/admin/logs"     element={<AdminLog />} />
        <Route path="/admin/models"   element={<ModelManager />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;