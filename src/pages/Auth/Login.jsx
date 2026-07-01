import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError('Hãy nhập email và mật khẩu.');
      return;
    }
    if (login(email, password)) navigate('/dashboard');
    else setError('Mock login thất bại.');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#040d1a] p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[380px] p-8 sm:p-10 rounded-[2rem] bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-5 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <span className="text-3xl font-black text-white tracking-wider">ND</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide mb-1">Đăng nhập</h2>
          <p className="text-cyan-400/80 text-base font-medium">Mock auth cho Advanced CV BBox Lab</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-base font-medium text-slate-300 mb-2">Email</label>
            <input type="email" className="w-full bg-[#071526]/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" placeholder="admin@example.local" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label className="block text-base font-medium text-slate-300 mb-2">Mật khẩu</label>
            <input type="password" className="w-full bg-[#071526]/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-base placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" placeholder="mock password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>

          {error && <p className="text-red-400 text-base bg-red-400/10 border border-red-400/20 rounded-2xl px-5 py-3">{error}</p>}

          <button type="submit" className="w-full mt-3 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:from-cyan-400 hover:to-blue-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#040d1a] transition-all shadow-lg shadow-cyan-500/25">
            Đăng nhập
          </button>
        </form>

        <p className="text-center text-base text-slate-400 mt-8">
          Chưa có profile local?{' '}
          <Link to="/register" className="text-cyan-400 font-semibold hover:text-cyan-300 hover:underline transition-colors">Tạo profile</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
