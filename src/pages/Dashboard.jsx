// src/pages/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/Common/Card';

const recentRuns = [
  { id: 'RUN-0001', file: 'digits_test_01.png', chars: 5, avgConf: 94, status: 'success', time: '2 phút trước' },
  { id: 'RUN-0002', file: 'noisy_sample.jpg', chars: 3, avgConf: 71, status: 'success', time: '15 phút trước' },
  { id: 'RUN-0003', file: 'blurry_chars.png', chars: 0, avgConf: 0, status: 'error', time: '1 giờ trước' },
  { id: 'RUN-0004', file: 'test_heavy_noise.png', chars: 8, avgConf: 82, status: 'success', time: '2 giờ trước' },
];

const TIPS = [
  { icon: '🖼️', text: 'Dùng ảnh nền trắng, chữ đen rõ nét cho kết quả tốt nhất.' },
  { icon: '⚙️', text: 'Chọn preset "Ảnh nhiễu nặng" nếu ảnh có nhiều đốm hoặc vệt.' },
  { icon: '🔍', text: 'Giảm Min Area nếu ký tự nhỏ không được phát hiện.' },
  { icon: '💡', text: 'Dùng Adaptive Threshold khi ánh sáng không đều trong ảnh.' },
];

const Dashboard = () => (
  <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
    {/* Welcome banner */}
    <div
      className="rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      style={{ background: 'linear-gradient(120deg, #0a2244 0%, #0d3d6b 50%, #0a3a34 100%)', border: '1px solid rgba(56,189,248,0.2)' }}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#2dd4bf' }}>Xin chào 👋</p>
        <h1 className="text-2xl font-black text-white">Dashboard cá nhân</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Tổng quan hoạt động nhận diện ký tự của bạn</p>
      </div>
      <Link
        to="/process"
        className="flex items-center gap-2 font-bold text-sm px-5 py-3 rounded-xl transition-all hover:scale-105 flex-shrink-0"
        style={{ background: 'linear-gradient(90deg, #0d9488, #38bdf8)', color: 'white', boxShadow: '0 4px 15px rgba(13,148,136,0.4)' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Upload ảnh mới
      </Link>
      {/* Decorative orb */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)' }} />
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Tổng lần chạy" value="24" sub="Tháng này" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} color="#38bdf8" />
      <StatCard label="Thành công" value="21" sub="3 lỗi pipeline" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="#22c55e" />
      <StatCard label="Avg Confidence" value="88%" sub="Tốt" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} color="#2dd4bf" />
      <StatCard label="Ký tự nhận diện" value="157" sub="Tổng cộng" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>} color="#818cf8" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent results */}
      <div
        className="lg:col-span-2 rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
          <h2 className="font-bold text-slate-200 text-sm">Kết quả gần đây</h2>
          <Link to="/history" className="text-xs font-semibold" style={{ color: '#38bdf8' }}>Xem tất cả →</Link>
        </div>
        <div className="divide-y" style={{ borderColor: 'rgba(56,189,248,0.06)' }}>
          {recentRuns.map((run) => (
            <div key={run.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/3 transition-all">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: run.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}
                >
                  {run.status === 'success'
                    ? <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: '#e2e8f0' }}>{run.file}</p>
                  <p className="text-[11px]" style={{ color: '#475569' }}>{run.id} · {run.time}</p>
                </div>
              </div>
              <div className="text-right">
                {run.status === 'success' && (
                  <>
                    <p className="text-xs font-bold" style={{ color: '#2dd4bf' }}>{run.chars} ký tự</p>
                    <p className="text-[11px]" style={{ color: '#475569' }}>conf {run.avgConf}%</p>
                  </>
                )}
                {run.status === 'error' && <p className="text-xs font-semibold" style={{ color: '#fca5a5' }}>Lỗi pipeline</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}
      >
        <h2 className="font-bold text-slate-200 text-sm mb-4">Mẹo sử dụng</h2>
        <div className="space-y-3">
          {TIPS.map((t, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.08)' }}
            >
              <span className="text-lg flex-shrink-0">{t.icon}</span>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{t.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 p-3 rounded-xl" style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(45,212,191,0.2)' }}>
          <p className="text-[11px] font-bold mb-1" style={{ color: '#2dd4bf' }}>Model đang dùng</p>
          <p className="text-xs font-semibold text-slate-300">CNN v2.1 — 36 classes</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>Acc 96.4% trên EMNIST</p>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
