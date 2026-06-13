import React from 'react';

const Header = () => {
  return (
    <header className="top-header">
      <div className="header-title">Hệ thống Nhận diện Kí tự Nhiễu (Noisy Digits)</div>
      
      {/* Trạng thái hệ thống */}
      <div className="header-badge flex items-center gap-2">
        <div className="header-live-dot"></div>
        System Online
      </div>
    </header>
  );
};

export default Header;