import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'noisy_digits_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const login = (email, password, name) => {
    if (!email || !password) return false;
    const isAdmin = email.toLowerCase().includes('admin');
    const nextUser = {
      name: name || (isAdmin ? 'Demo Administrator' : 'Demo User'),
      email,
      role: isAdmin ? 'Administrator' : 'User',
      initials: buildInitials(name || email),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const buildInitials = (value) => {
  const parts = String(value || 'User')
    .replace(/@.*/, '')
    .split(/[\s._-]+/)
    .filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
};
