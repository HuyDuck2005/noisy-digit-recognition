import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Vui lòng nhập đầy đủ thông tin.'); return; }
    const ok = login(email, password);
    if (ok) navigate('/dashboard');
    else setError('Tài khoản hoặc mật khẩu không đúng.');
  };

  return (
    <div className="card p-8 shadow-2xl border-sky-500/30 border-2">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#0d3d6b] to-[#0d9488] mb-4 shadow-lg shadow-teal-500/30">
          <span className="text-2xl font-black text-white">ND</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Đăng nhập hệ thống</h2>
        <p className="text-slate-400 text-sm mt-2">Nhận diện kí tự nhiễu (Noisy Digits)</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Email</label>
          <input type="text" className="form-input" placeholder="admin@noisydigits.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Mật khẩu</label>
          <input type="password" className="form-input" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" className="btn btn-primary w-full mt-2 py-3">
          Đăng nhập ngay
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-teal font-bold hover:underline">Đăng ký</Link>
      </p>
    </div>
  );
};

export default Login;