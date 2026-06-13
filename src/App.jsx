import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Import Pages
import Dashboard from './pages/Dashboard';
import ImageProcess from './pages/ImageProcess';
import History from './pages/History';
import AdminLog from './pages/AdminLog';
import ModelManager from './pages/ModelManager';
import Login from './pages/Auth/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Luồng cho người chưa đăng nhập */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Luồng chính của ứng dụng (Có Sidebar & Header) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/process" element={<ImageProcess />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin/logs" element={<AdminLog />} />
          <Route path="/admin/models" element={<ModelManager />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;