import React from 'react';

const PipelineFeedback = ({
  comment,
  statistics,
  mode = 'opencv_advanced_bbox',
  recognitionEnabled = false,
  modelTrained = false,
}) => {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(45,212,191,0.22)', borderLeft: '3px solid #2dd4bf' }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-sm" style={{ color: '#2dd4bf' }}>System feedback</h3>
          <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{comment || 'Run the pipeline to generate bbox feedback.'}</p>
        </div>
        <span className="badge badge-teal">BBox only</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Meta label="Current mode" value={mode} />
        <Meta label="Model trained" value={modelTrained ? 'Yes' : 'No'} />
        <Meta label="Recognition enabled" value={recognitionEnabled ? 'Yes' : 'No'} />
        <Meta label="Branch count" value={statistics?.branch_count ?? 1} />
      </div>
    </div>
  );
};

const Meta = ({ label, value }) => (
  <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(7,21,38,0.55)', border: '1px solid rgba(56,189,248,0.08)' }}>
    <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#64748b' }}>{label}</p>
    <p className="text-xs font-semibold mt-1 text-slate-200">{value}</p>
  </div>
);

export default PipelineFeedback;
