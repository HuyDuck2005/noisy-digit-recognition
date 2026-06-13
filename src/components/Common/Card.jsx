// src/components/Common/Card.jsx
import React from 'react';

const Card = ({ children, className = '', glow = false, title, subtitle }) => {
  return (
    <div
      className={`rounded-2xl p-5 glass-card ${className}`}
      style={glow ? { boxShadow: '0 0 30px rgba(13,148,136,0.15)' } : {}}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-bold text-slate-200 text-base">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export const StatCard = ({ label, value, sub, icon, color = '#2dd4bf' }) => (
  <div
    className="rounded-2xl p-5 relative overflow-hidden"
    style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{label}</p>
        <p className="text-3xl font-black mt-1" style={{ color }}>{value}</p>
        {sub && <p className="text-xs mt-1" style={{ color: '#475569' }}>{sub}</p>}
      </div>
      {icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      )}
    </div>
    <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}00, ${color}60, ${color}00)` }} />
  </div>
);

export default Card;
