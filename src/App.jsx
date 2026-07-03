import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

import AdminLog from './pages/AdminLog';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import ImageProcess from './pages/ImageProcess';
import ModelManager from './pages/ModelManager';
import Register from './pages/Register';
import Login from './pages/Auth/Login';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'Administrator') return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      </Route>

      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/process" element={<ImageProcess />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin/logs" element={<AdminRoute><AdminLog /></AdminRoute>} />
        <Route path="/admin/models" element={<AdminRoute><ModelManager /></AdminRoute>} />
      </Route>

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
