import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isAdminActive = () => location.pathname.startsWith('/admin');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-badge">ND</div>
        <div className="logo-title">Noisy<span>Digits</span></div>
        <div className="logo-sub">Hệ thống nhận diện</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-label">Chức năng chính</div>

        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          Dashboard
        </Link>

        <Link to="/process" className={`nav-item ${isActive('/process') ? 'active' : ''}`}>
          <span className="nav-icon">🖼️</span>
          Xử lý ảnh
        </Link>

        <Link to="/history" className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
          <span className="nav-icon">🕒</span>
          Lịch sử
        </Link>

        <div className="nav-label" style={{ marginTop: 16 }}>Hệ thống</div>

        <Link to="/admin/models" className={`nav-item ${isAdminActive() ? 'active' : ''}`}>
          <span className="nav-icon">⚙️</span>
          Quản trị viên
        </Link>
      </nav>

      {/* User block với nút logout */}
      <div className="sidebar-user" style={{ position: 'relative' }}>
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setShowLogout(!showLogout)}
          title="Nhấn để đăng xuất"
        >
          <div className="user-avatar">{user?.initials || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user?.name || 'Người dùng'}</div>
            <div className="user-role">{user?.role || 'User'}</div>
          </div>
          <span style={{ color: '#64748b', fontSize: 12 }}>{showLogout ? '▲' : '▼'}</span>
        </div>

        {showLogout && (
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#fca5a5',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🚪 Đăng xuất
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;