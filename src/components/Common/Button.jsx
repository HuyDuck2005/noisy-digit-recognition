// src/components/Common/Button.jsx
import React from 'react';

const Button = ({ children, onClick, variant = 'primary', disabled = false, className = '', type = 'button', size = 'md' }) => {
  const sizes = { sm: 'py-1.5 px-3 text-xs', md: 'py-2.5 px-5 text-sm', lg: 'py-3.5 px-7 text-base' };
  const variants = {
    primary: {
      background: 'linear-gradient(90deg, #0d3d6b, #0d9488)',
      color: 'white',
      border: '1px solid rgba(56,189,248,0.3)',
      boxShadow: '0 4px 15px rgba(13,148,136,0.3)',
    },
    secondary: {
      background: 'rgba(13,61,107,0.3)',
      color: '#94a3b8',
      border: '1px solid rgba(56,189,248,0.15)',
      boxShadow: 'none',
    },
    danger: {
      background: 'rgba(220,38,38,0.15)',
      color: '#fca5a5',
      border: '1px solid rgba(220,38,38,0.3)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: '#64748b',
      border: '1px solid rgba(100,116,139,0.2)',
      boxShadow: 'none',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 ${sizes[size]} ${className}`}
      style={variants[variant]}
    >
      {children}
    </button>
  );
};

export default Button;
