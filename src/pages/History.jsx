// src/pages/History.jsx
import React, { useState } from 'react';

const HISTORY = [
  { id: 'RUN-0001', file: 'digits_test_01.png', chars: 5, avgConf: 94, status: 'success', time: '12/06/2026 10:32', preset: 'Ảnh sạch', ms: 1340 },
  { id: 'RUN-0002', file: 'noisy_sample.jpg', chars: 3, avgConf: 71, status: 'success', time: '12/06/2026 09:14', preset: 'Nhiễu nhẹ', ms: 2100 },
  { id: 'RUN-0003', file: 'blurry_chars.png', chars: 0, avgConf: 0, status: 'error', time: '11/06/2026 22:05', preset: 'Nhiễu nặng', ms: 890 },
  { id: 'RUN-0004', file: 'test_heavy_noise.png', chars: 8, avgConf: 82, status: 'success', time: '11/06/2026 18:44', preset: 'Nhiễu nặng', ms: 3200 },
  { id: 'RUN-0005', file: 'alphabet_A.png', chars: 1, avgConf: 99, status: 'success', time: '10/06/2026 15:30', preset: 'Ảnh sạch', ms: 950 },
];

const History = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = HISTORY.filter((r) => {
    const matchStatus = filter === 'all' || r.status === filter;
    const matchSearch = r.file.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#2dd4bf' }}>Lịch sử</p>
        <h1 className="text-2xl font-black text-white">Lịch sử xử lý ảnh</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Tìm theo tên file hoặc mã chạy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 py-2.5 px-4 text-sm rounded-xl outline-none"
          style={{ background: 'rgba(13,30,60,0.7)', color: '#e2e8f0', border: '1px solid rgba(56,189,248,0.15)', '::placeholder': { color: '#475569' } }}
        />
        <div className="flex gap-2">
          {[['all','Tất cả'],['success','Thành công'],['error','Lỗi']].map(([v,l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: filter === v ? 'rgba(13,148,136,0.2)' : 'rgba(13,30,60,0.5)',
                color: filter === v ? '#2dd4bf' : '#64748b',
                border: `1px solid ${filter === v ? 'rgba(45,212,191,0.35)' : 'rgba(56,189,248,0.1)'}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(7,21,38,0.8)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
              {['Mã chạy', 'File', 'Preset', 'Ký tự', 'Confidence', 'Thời gian', 'Thời điểm', 'Hành động'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((run, i) => (
              <tr
                key={run.id}
                style={{
                  borderTop: '1px solid rgba(56,189,248,0.05)',
                  background: i % 2 === 0 ? 'rgba(13,30,60,0.3)' : 'transparent',
                }}
                className="transition-all hover:bg-white/3"
              >
                <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: '#38bdf8' }}>{run.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: run.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                      {run.status === 'success'
                        ? <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      }
                    </div>
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{run.file}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{run.preset}</td>
                <td className="px-4 py-3 text-center">
                  <span className="font-black text-base" style={{ color: run.chars > 0 ? '#38bdf8' : '#ef4444' }}>{run.chars}</span>
                </td>
                <td className="px-4 py-3">
                  {run.avgConf > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${run.avgConf}%`, background: run.avgConf >= 85 ? '#22c55e' : run.avgConf >= 60 ? '#eab308' : '#ef4444' }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>{run.avgConf}%</span>
                    </div>
                  ) : <span className="text-xs" style={{ color: '#475569' }}>—</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: '#64748b' }}>{run.ms}ms</td>
                <td className="px-4 py-3 text-xs" style={{ color: '#475569' }}>{run.time}</td>
                <td className="px-4 py-3">
                  <button
                    className="text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                    style={{ background: 'rgba(56,189,248,0.08)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.15)' }}
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-3xl mb-3">🔍</p>
            <p className="font-bold text-slate-400">Không tìm thấy kết quả</p>
            <p className="text-xs mt-1" style={{ color: '#334155' }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}

        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(56,189,248,0.06)' }}>
          <p className="text-[11px]" style={{ color: '#475569' }}>Hiển thị {filtered.length} / {HISTORY.length} kết quả</p>
        </div>
      </div>
    </div>
  );
};

export default History;
