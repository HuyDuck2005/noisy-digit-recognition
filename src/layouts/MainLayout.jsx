// src/layouts/MainLayout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MainLayout = ({ children }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/process', icon: '🔍', label: 'Xử lý hình ảnh' },
    { path: '/history', icon: '🕰️', label: 'Lịch sử chạy' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            N
          </div>
          <h1 className="font-extrabold text-lg text-slate-800 tracking-tight">Noisy<span className="text-cyan-600">Digit</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
                  isActive 
                    ? 'bg-cyan-50 text-cyan-700 shadow-sm border border-cyan-100/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              U
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Người dùng User</p>
              <p className="text-[10px] text-slate-500">Demo Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm/50 z-0">
          <h2 className="text-sm font-semibold text-slate-500">
            Hệ thống nhận diện chữ số và chữ cái (CNN & OpenCV)
          </h2>
          <div className="flex gap-4">
             {/* Nút thông báo/Cài đặt giả lập */}
             <button className="text-slate-400 hover:text-cyan-600 transition-colors">🔔</button>
             <button className="text-slate-400 hover:text-cyan-600 transition-colors">⚙️</button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;