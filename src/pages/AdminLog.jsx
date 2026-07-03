import React, { useState } from 'react';

const LOGS = [
  { time: 'local', level: 'INFO', msg: 'Advanced Classical CV BBox Pipeline đang là phase hiện tại.', src: 'pipeline' },
  { time: 'local', level: 'INFO', msg: 'Nhận dạng đang tắt. Chỉ tạo bbox ứng viên.', src: 'bbox' },
  { time: 'local', level: 'INFO', msg: 'Phase này chưa cần dataset.', src: 'datasets' },
];

const USERS = [
  { id: 'demo-admin', email: 'admin@example.local', role: 'Administrator', auth: 'mock' },
  { id: 'demo-user', email: 'user@example.local', role: 'User', auth: 'mock' },
];

const LEVEL_STYLE = {
  INFO: { bg: 'rgba(34,197,94,0.1)', color: '#86efac' },
  WARN: { bg: 'rgba(234,179,8,0.1)', color: '#fde047' },
  ERROR: { bg: 'rgba(239,68,68,0.1)', color: '#fca5a5' },
};

const AdminLog = () => {
  const [tab, setTab] = useState('logs');

  return (
    <div className="flex flex-col gap-6 anim-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-eyebrow">Quản trị</h2>
          <h1 className="page-title">Trạng thái hệ thống</h1>
          <p className="page-sub">Mock auth, OpenCV BBox Pipeline, chưa cần dataset.</p>
        </div>
        <span className="badge badge-red">ADMIN</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Info label="Pipeline" value="Advanced CV" />
        <Info label="Output" value="BBox ứng viên" />
        <Info label="Dataset" value="Chưa cần" />
        <Info label="Training" value="Phase sau" />
      </div>

      <div className="flex gap-2">
        {[['logs', 'Log hệ thống'], ['users', 'User'], ['model', 'Train phase sau']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`btn btn-sm ${tab === id ? 'btn-primary' : 'btn-ghost'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'logs' && (
        <div className="rounded-2xl overflow-hidden font-mono" style={{ background: 'rgba(4,13,26,0.9)', border: '1px solid rgba(56,189,248,0.12)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
            <span className="text-[11px]" style={{ color: '#64748b' }}>system.log - frontend demo</span>
          </div>
          <div className="p-4 space-y-2">
            {LOGS.map((log, index) => (
              <div key={index} className="flex items-start gap-3 py-1">
                <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: '#64748b' }}>{log.time}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0" style={LEVEL_STYLE[log.level]}>{log.level}</span>
                <span className="text-[11px] flex-shrink-0" style={{ color: '#38bdf8' }}>[{log.src}]</span>
                <span className="text-[11px]" style={{ color: '#94a3b8' }}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Email</th><th>Role</th><th>Auth</th></tr>
            </thead>
            <tbody>
              {USERS.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.auth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'model' && (
        <div className="card">
          <h3 className="card-title">Chưa có model đã train</h3>
          <p className="card-sub mt-2">Hiện tại chỉ tiền xử lý và trích bbox ứng viên. Training/export sẽ làm sau khi bbox baseline ổn định.</p>
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ fontSize: 24, color: '#2dd4bf' }}>{value}</div>
  </div>
);

export default AdminLog;
