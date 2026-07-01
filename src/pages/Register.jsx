import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirm) {
      setError('Hãy nhập đủ thông tin.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setError('');
    login(form.email, form.password, form.name);
    navigate('/dashboard');
  };

  return (
    <div className="card p-8 shadow-2xl border-sky-500/30 border-2">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#0d3d6b] to-[#0d9488] mb-4 shadow-lg shadow-teal-500/30">
          <span className="text-2xl font-black text-white">ND</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Tạo profile local</h2>
        <p className="text-slate-400 text-sm mt-2">Mock auth cho Advanced CV BBox Lab.</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Field label="Tên">
          <input name="name" type="text" className="form-input" placeholder="Demo User" value={form.name} onChange={handleChange} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" className="form-input" placeholder="admin@example.local" value={form.email} onChange={handleChange} />
        </Field>
        <Field label="Mật khẩu">
          <input name="password" type="password" className="form-input" placeholder="mock password" value={form.password} onChange={handleChange} />
        </Field>
        <Field label="Xác nhận mật khẩu">
          <input name="confirm" type="password" className="form-input" placeholder="mock password" value={form.confirm} onChange={handleChange} />
        </Field>

        {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" className="btn btn-primary w-full mt-2 py-3">
          Tạo profile
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Đã có profile local?{' '}
        <Link to="/login" className="text-teal font-bold hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export default Register;
