import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Khối Logo */}
      <div className="sidebar-logo">
        <div className="logo-badge">ND</div>
        <div className="logo-title">Noisy<span>Digits</span></div>
        <div className="logo-sub">Hệ thống nhận diện</div>
      </div>

      {/* Khối Menu Điều hướng */}
      <nav className="sidebar-nav">
        <div className="nav-label">Chức năng chính</div>
        
        <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          Dashboard
        </Link>
        
        <Link to="/process" className={`nav-item ${location.pathname === '/process' ? 'active' : ''}`}>
          <span className="nav-icon">🖼️</span>
          Xử lý ảnh
        </Link>
        
        <Link to="/history" className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
          <span className="nav-icon">🕒</span>
          Lịch sử
        </Link>

        <div className="nav-label mt-4">Hệ thống</div>
        
        <Link to="/admin/models" className={`nav-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
  <span className="nav-icon">⚙️</span>
  Quản trị viên
</Link>
      </nav>

      {/* Khối Thông tin người dùng ở đáy Sidebar */}
      <div className="sidebar-user">
        <div className="flex items-center gap-3">
          <div className="user-avatar">VĐ</div>
          <div>
            <div className="user-name">Vũ Huy Đức</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;