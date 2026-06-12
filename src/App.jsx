// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ImageProcess from './pages/ImageProcess';

// Mock trang Dashboard tạm thời
const DummyDashboard = () => (
  <div className="p-8 text-slate-500 font-medium">Trang Dashboard đang được xây dựng...</div>
);

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/process" replace />} />
          <Route path="/dashboard" element={<DummyDashboard />} />
          <Route path="/process" element={<ImageProcess />} />
          <Route path="/history" element={<div className="p-8 text-slate-500">Trang lịch sử đang được xây dựng...</div>} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;