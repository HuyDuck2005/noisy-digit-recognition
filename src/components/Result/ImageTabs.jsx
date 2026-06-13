// src/components/Result/ImageTabs.jsx
import React, { useState } from 'react';

const TABS = [
  { id: 'original', label: 'Gốc', num: '01', desc: 'Ảnh đầu vào của người dùng', color: '#38bdf8' },
  { id: 'grayscale', label: 'Ảnh Xám', num: '02', desc: 'Chuyển RGB → Grayscale để giảm tải tính toán', color: '#94a3b8' },
  { id: 'binary', label: 'Nhị Phân', num: '03', desc: 'Otsu/Adaptive Threshold phân tách chữ và nền', color: '#e2e8f0' },
  { id: 'morphology', label: 'Morphology', num: '04', desc: 'Opening & Closing xóa nhiễu, nối nét đứt', color: '#818cf8' },
  { id: 'components', label: 'Components', num: '05', desc: 'Phân vùng connected components — mỗi màu 1 ký tự', color: '#2dd4bf' },
];

const MOCK_IMGS = {
  original: 'https://via.placeholder.com/560x220/071526/38bdf8?text=01+|+Original+Image',
  grayscale: 'https://via.placeholder.com/560x220/1e293b/94a3b8?text=02+|+Grayscale+Conversion',
  binary: 'https://via.placeholder.com/560x220/000000/ffffff?text=03+|+Binary+Threshold+(Otsu)',
  morphology: 'https://via.placeholder.com/560x220/0f1a2b/818cf8?text=04+|+Morphology+Clean',
  components: 'https://via.placeholder.com/560x220/0a2040/2dd4bf?text=05+|+Connected+Components',
};

const ImageTabs = ({ pipelineImages }) => {
  const [active, setActive] = useState('original');
  const imgs = pipelineImages || MOCK_IMGS;
  const tab = TABS.find((t) => t.id === active);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        <h3 className="font-bold text-slate-200 text-sm">Pipeline Xử Lý Ảnh Trung Gian</h3>
        <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>Trực quan hóa từng bước thuật toán OpenCV</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-2" style={{ background: 'rgba(7,21,38,0.5)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className="flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all duration-200"
            style={{
              background: active === t.id ? `rgba(56,189,248,0.12)` : 'transparent',
              border: active === t.id ? `1px solid ${t.color}40` : '1px solid transparent',
            }}
          >
            <span
              className="text-[10px] font-bold font-mono"
              style={{ color: active === t.id ? t.color : '#334155' }}
            >
              {t.num}
            </span>
            <span
              className="text-[11px] font-semibold mt-0.5"
              style={{ color: active === t.id ? '#e2e8f0' : '#475569' }}
            >
              {t.label}
            </span>
            {active === t.id && (
              <div className="w-4 h-0.5 rounded-full mt-1" style={{ background: t.color }} />
            )}
          </button>
        ))}
      </div>

      {/* Image area */}
      <div className="p-4">
        <div
          className="rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: '#040d1a', minHeight: '180px', border: '1px solid rgba(56,189,248,0.08)' }}
        >
          <img
            src={imgs[active]}
            alt={active}
            key={active}
            className="w-full h-auto object-contain animate-fadeIn"
            style={{ maxHeight: '220px' }}
          />
        </div>

        <div
          className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(7,21,38,0.5)', border: `1px solid ${tab.color}20` }}
        >
          <span className="text-base mt-0.5" style={{ color: tab.color }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <p className="text-xs" style={{ color: '#64748b' }}>{tab.desc}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageTabs;
