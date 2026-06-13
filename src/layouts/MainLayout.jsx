// src/layouts/MainLayout.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/process',
    label: 'Xử lý ảnh',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    path: '/history',
    label: 'Lịch sử',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    path: '/admin',
    label: 'Quản trị',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const MainLayout = ({ children }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#071526' }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 sidebar-bg ${collapsed ? 'w-16' : 'w-60'}`}
        style={{ minHeight: '100vh' }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg"
            style={{ background: 'linear-gradient(135deg, #0d3d6b, #0d9488)', boxShadow: '0 0 18px rgba(13,148,136,0.4)' }}
          >
            <span className="text-white">N</span>
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-black text-sm tracking-tight" style={{ color: '#e2e8f0' }}>
                Noisy<span style={{ color: '#2dd4bf' }}>Digit</span>
              </p>
              <p className="text-[10px]" style={{ color: '#64748b' }}>Recognition System</p>
            </div>
          )}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`mx-3 mb-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1`}
          style={{ background: 'rgba(56,189,248,0.08)', color: '#94a3b8', border: '1px solid rgba(56,189,248,0.1)' }}
        >
          {collapsed ? '›' : '‹ Thu gọn'}
        </button>

        {/* Nav */}
        <nav className="flex-1 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  active ? 'text-white' : 'text-slate-400 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
                style={
                  active
                    ? {
                        background: 'linear-gradient(90deg, rgba(13,61,107,0.9), rgba(13,148,136,0.4))',
                        border: '1px solid rgba(56,189,248,0.25)',
                        boxShadow: '0 0 12px rgba(13,148,136,0.2)',
                      }
                    : { background: 'transparent' }
                }
              >
                <span className={active ? 'text-sky-400' : 'text-slate-500'}>{item.icon}</span>
                {!collapsed && item.label}
                {!collapsed && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#2dd4bf' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 mx-2 mb-3 rounded-xl" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.1)' }}>
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #0d3d6b, #0d9488)', color: '#e2e8f0' }}
            >
              U
            </div>
            {!collapsed && (
              <div>
                <p className="text-xs font-bold text-slate-300">Người dùng</p>
                <p className="text-[10px] text-slate-500">user@demo.local</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-6 flex-shrink-0"
          style={{ background: 'rgba(7,21,38,0.95)', borderBottom: '1px solid rgba(56,189,248,0.1)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#38bdf8' }}>
              Hệ thống nhận diện ký tự nhiễu
            </span>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2dd4bf' }} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(13,148,136,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
              CNN + OpenCV + LLM
            </span>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110" style={{ color: '#64748b' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin" style={{ background: 'linear-gradient(160deg, #071526 0%, #0a2040 50%, #071f2e 100%)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
