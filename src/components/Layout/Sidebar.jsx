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

  // Helper render Nav Item
  const NavItem = ({ to, icon, label, active }) => (
    <Link 
      to={to} 
      className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-xl transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-400 text-cyan-300 shadow-[inset_4px_0_0_0_rgba(34,211,238,0.2)]' 
          : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );

  return (
    <aside className="w-64 h-screen bg-[#071526]/80 backdrop-blur-xl border-r border-white/5 flex flex-col flex-shrink-0 z-50">
      {/* Logo */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="text-white font-black tracking-wider">ND</span>
        </div>
        <div className="flex flex-col">
          <span className="text-white font-bold text-lg tracking-wide">Noisy<span className="text-cyan-400">Digits</span></span>
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Hệ thống AI</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">Chức năng chính</div>
        <NavItem to="/dashboard" icon="📊" label="Dashboard" active={isActive('/dashboard') || isActive('/')} />
        <NavItem to="/process" icon="🖼️" label="Xử lý ảnh" active={isActive('/process')} />
        <NavItem to="/history" icon="🕒" label="Lịch sử" active={isActive('/history')} />

        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2 mt-8">Hệ thống</div>
        <NavItem to="/admin/models" icon="⚙️" label="Quản trị viên" active={isAdminActive()} />
      </nav>

      {/* User block */}
      <div className="p-4 border-t border-white/5 bg-[#040d1a]/50">
        <div 
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          onClick={() => setShowLogout(!showLogout)}
        >
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-cyan-400 font-bold">
            {user?.initials || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium text-sm truncate">{user?.name || 'Vũ Huy Đức'}</div>
            <div className="text-slate-500 text-xs truncate">{user?.role || 'Administrator'}</div>
          </div>
          <span className="text-slate-500 text-xs">{showLogout ? '▲' : '▼'}</span>
        </div>

        {showLogout && (
          <button
            onClick={handleLogout}
            className="w-full mt-2 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
          >
            🚪 Đăng xuất
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;