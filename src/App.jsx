// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import ImageProcess from './pages/ImageProcess';
import History from './pages/History';
import AdminLog from './pages/AdminLog';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/process" element={<ImageProcess />} />
          <Route path="/history" element={<History />} />
          <Route path="/admin" element={<AdminLog />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
