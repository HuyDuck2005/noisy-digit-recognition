// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ImageProcess from './pages/ImageProcess';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        {/* Simple Header */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="container mx-auto flex justify-between items-center max-w-5xl">
            <div className="font-bold text-xl text-blue-600">CV & CNN Demo</div>
            <nav className="space-x-4 text-sm font-medium">
              <span className="text-gray-500 cursor-pointer">Dashboard</span>
              <span className="text-blue-600 cursor-pointer">Xử lý ảnh</span>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-6">
          <Routes>
            <Route path="/" element={<Navigate to="/process" />} />
            <Route path="/process" element={<ImageProcess />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;