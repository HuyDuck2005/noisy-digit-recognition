import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('Vui lòng điền đầy đủ thông tin.'); return;
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.'); return;
    }
    setError('');
    login(form.email, form.password);
    navigate('/dashboard');
  };

  return (
    <div className="card p-8 shadow-2xl border-sky-500/30 border-2">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#0d3d6b] to-[#0d9488] mb-4 shadow-lg shadow-teal-500/30">
          <span className="text-2xl font-black text-white">ND</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Tạo tài khoản</h2>
        <p className="text-slate-400 text-sm mt-2">Nhận diện kí tự nhiễu (Noisy Digits)</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Họ và tên</label>
          <input name="name" type="text" className="form-input" placeholder="Nguyễn Văn A"
            value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input name="email" type="email" className="form-input" placeholder="example@email.com"
            value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label className="form-label">Mật khẩu</label>
          <input name="password" type="password" className="form-input" placeholder="••••••••"
            value={form.password} onChange={handleChange} />
        </div>
        <div>
          <label className="form-label">Xác nhận mật khẩu</label>
          <input name="confirm" type="password" className="form-input" placeholder="••••••••"
            value={form.confirm} onChange={handleChange} />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <button type="submit" className="btn btn-primary w-full mt-2 py-3">
          Đăng ký ngay
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-teal font-bold hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
};

export default Register;