// src/pages/AdminLog.jsx
import React, { useState } from 'react';

const USERS = [
  { id: 'U001', name: 'user@demo.local', role: 'USER', runs: 24, lastLogin: '13/06/2026', status: 'active' },
  { id: 'U002', name: 'tester@lab.vn', role: 'USER', runs: 7, lastLogin: '11/06/2026', status: 'active' },
  { id: 'A001', name: 'admin@system', role: 'ADMIN', runs: 102, lastLogin: '13/06/2026', status: 'active' },
];

const LOGS = [
  { time: '10:32:14', level: 'INFO', msg: 'Pipeline completed for RUN-0001 — 5 chars detected', src: 'pipeline' },
  { time: '09:14:07', level: 'WARN', msg: 'Low confidence detected on box #2 (52%). Suggest Adaptive threshold.', src: 'cnn' },
  { time: '22:05:55', level: 'ERROR', msg: 'No valid bounding box found. Min area too high.', src: 'opencv' },
  { time: '18:44:33', level: 'INFO', msg: 'Model CNN v2.1 loaded successfully.', src: 'model' },
  { time: '15:30:00', level: 'INFO', msg: 'LLM comment generated in 420ms.', src: 'llm' },
];

const LEVEL_STYLE = {
  INFO: { bg: 'rgba(34,197,94,0.1)', color: '#86efac' },
  WARN: { bg: 'rgba(234,179,8,0.1)', color: '#fde047' },
  ERROR: { bg: 'rgba(239,68,68,0.1)', color: '#fca5a5' },
};

const AdminLog = () => {
  const [tab, setTab] = useState('logs');

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fadeIn">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#f87171' }}>Quản trị viên</p>
          <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
          ADMIN ONLY
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Người dùng', value: '3', color: '#38bdf8' },
          { label: 'Tổng lần chạy', value: '133', color: '#2dd4bf' },
          { label: 'Tỉ lệ lỗi', value: '4.2%', color: '#f87171' },
          { label: 'Model active', value: 'v2.1', color: '#818cf8' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] mt-1" style={{ color: '#475569' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[['logs','Log hệ thống'],['users','Người dùng'],['model','Model CNN']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: tab === id ? 'rgba(13,148,136,0.2)' : 'rgba(13,30,60,0.5)',
              color: tab === id ? '#2dd4bf' : '#64748b',
              border: `1px solid ${tab === id ? 'rgba(45,212,191,0.35)' : 'rgba(56,189,248,0.1)'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Logs */}
      {tab === 'logs' && (
        <div className="rounded-2xl overflow-hidden font-mono" style={{ background: 'rgba(4,13,26,0.9)', border: '1px solid rgba(56,189,248,0.12)' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#eab308' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
            <span className="ml-3 text-[11px]" style={{ color: '#475569' }}>system.log — backend</span>
          </div>
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {LOGS.map((log, i) => (
              <div key={i} className="flex items-start gap-3 py-1">
                <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: '#334155' }}>{log.time}</span>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0"
                  style={LEVEL_STYLE[log.level]}
                >
                  {log.level}
                </span>
                <span className="text-[11px] flex-shrink-0" style={{ color: '#38bdf8' }}>[{log.src}]</span>
                <span className="text-[11px] break-all" style={{ color: '#64748b' }}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(7,21,38,0.8)' }}>
                {['ID','Email','Role','Số lần chạy','Đăng nhập cuối','Trạng thái'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USERS.map((u, i) => (
                <tr key={u.id} style={{ borderTop: '1px solid rgba(56,189,248,0.05)', background: i % 2 === 0 ? 'rgba(13,30,60,0.3)' : 'transparent' }}>
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#38bdf8' }}>{u.id}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{u.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-black px-2 py-1 rounded-lg" style={{ background: u.role === 'ADMIN' ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)', color: u.role === 'ADMIN' ? '#fca5a5' : '#38bdf8' }}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: '#2dd4bf' }}>{u.runs}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{u.lastLogin}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac' }}>● Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Model */}
      {tab === 'model' && (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-bold text-white">CNN Model v2.1</h3>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>Đang hoạt động · Loaded 13/06/2026</p>
            </div>
            <span className="text-[11px] font-bold px-3 py-1.5 rounded-full animate-pulse" style={{ background: 'rgba(34,197,94,0.1)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
              ● ACTIVE
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Số class', value: '36', sub: '0-9, A-Z' },
              { label: 'Accuracy', value: '96.4%', sub: 'EMNIST dataset' },
              { label: 'Input shape', value: '28×28', sub: 'Grayscale' },
              { label: 'Framework', value: 'Keras', sub: 'TensorFlow 2.x' },
            ].map((m) => (
              <div key={m.label} className="p-4 rounded-xl" style={{ background: 'rgba(7,21,38,0.5)', border: '1px solid rgba(56,189,248,0.1)' }}>
                <p className="text-lg font-black" style={{ color: '#2dd4bf' }}>{m.value}</p>
                <p className="text-xs font-bold mt-1 text-slate-300">{m.label}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#334155' }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLog;
