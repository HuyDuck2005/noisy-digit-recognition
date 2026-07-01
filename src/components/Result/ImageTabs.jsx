import React, { useEffect, useMemo, useState } from 'react';

const TAB_CONFIG = [
  { id: 'original_url', label: 'Original', desc: 'Uploaded source image' },
  { id: 'grayscale_url', label: 'Grayscale', desc: 'Single-channel intensity image' },
  { id: 'denoised_url', label: 'Denoised', desc: 'Blurred image before thresholding' },
  { id: 'binary_url', label: 'Binary', desc: 'Foreground/background mask' },
  { id: 'morphology_url', label: 'Morphology', desc: 'Cleaned mask after morphology' },
  { id: 'components_url', label: 'Components', desc: 'Connected component visualization' },
  { id: 'output_url', label: 'Output', desc: 'Bounding boxes and mock labels' },
];

const ImageTabs = ({ pipelineImages }) => {
  const availableTabs = useMemo(
    () => TAB_CONFIG.map((tab) => ({ ...tab, url: pipelineImages?.[tab.id] || '' })),
    [pipelineImages],
  );
  const firstAvailable = availableTabs.find((tab) => tab.url)?.id || TAB_CONFIG[0].id;
  const [active, setActive] = useState(firstAvailable);

  useEffect(() => {
    setActive(firstAvailable);
  }, [firstAvailable]);

  const activeTab = availableTabs.find((tab) => tab.id === active) || availableTabs[0];

  if (!pipelineImages) {
    return (
      <div className="card text-center" style={{ padding: 28 }}>
        <h3 className="card-title">Pipeline Images</h3>
        <p className="card-sub mt-2">Run the OpenCV pipeline to generate real intermediate images.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        <h3 className="font-bold text-slate-200 text-sm">OpenCV Pipeline Images</h3>
        <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>Real backend artifacts from the latest run.</p>
      </div>

      <div className="flex gap-1 p-2 overflow-x-auto" style={{ background: 'rgba(7,21,38,0.5)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        {availableTabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => tab.url && setActive(tab.id)}
            disabled={!tab.url}
            className="min-w-[92px] flex flex-col items-center py-2 px-2 rounded-xl text-center transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              background: active === tab.id ? 'rgba(56,189,248,0.12)' : 'transparent',
              border: active === tab.id ? '1px solid rgba(56,189,248,0.35)' : '1px solid transparent',
            }}
          >
            <span className="text-[10px] font-bold font-mono" style={{ color: active === tab.id ? '#2dd4bf' : '#475569' }}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="text-[11px] font-semibold mt-0.5" style={{ color: active === tab.id ? '#e2e8f0' : '#64748b' }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <div className="p-4">
        <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#040d1a', minHeight: 220, border: '1px solid rgba(56,189,248,0.08)' }}>
          {activeTab?.url ? (
            <img src={activeTab.url} alt={activeTab.label} className="w-full h-auto object-contain animate-fadeIn" style={{ maxHeight: 360 }} />
          ) : (
            <p className="text-sm text-slate-500">Image not available for this stage.</p>
          )}
        </div>
        <p className="text-xs mt-3 px-3 py-2.5 rounded-xl" style={{ color: '#94a3b8', background: 'rgba(7,21,38,0.5)', border: '1px solid rgba(56,189,248,0.08)' }}>
          {activeTab?.desc}
        </p>
      </div>
    </div>
  );
};

export default ImageTabs;
