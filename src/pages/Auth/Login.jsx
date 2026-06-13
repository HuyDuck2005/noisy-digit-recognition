import React from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="card p-8 shadow-2xl border-sky-500/30 border-2">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#0d3d6b] to-[#0d9488] mb-4 shadow-lg shadow-teal-500/30">
          <span className="text-2xl font-black text-white">ND</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Đăng nhập hệ thống</h2>
        <p className="text-slate-400 text-sm mt-2">Nhận diện kí tự nhiễu (Noisy Digits)</p>
      </div>

      <form className="flex flex-col gap-4">
        <div>
          <label className="form-label">Tài khoản / Email</label>
          <input type="text" className="form-input" placeholder="admin@noisydigits.com" />
        </div>
        <div>
          <label className="form-label">Mật khẩu</label>
          <input type="password" className="form-input" placeholder="••••••••" />
        </div>
        
        <Link to="/dashboard" className="btn btn-primary w-full mt-4 py-3">
          Đăng nhập ngay
        </Link>
      </form>
    </div>
  );
};

export default Login;