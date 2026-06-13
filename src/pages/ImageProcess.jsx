// src/pages/ImageProcess.jsx
import React, { useState } from 'react';
import DragDropZone from '../components/Upload/DragDropZone';
import ImageTabs from '../components/Result/ImageTabs';
import BoundingBoxTable from '../components/Result/BoundingBoxTable';
import { uploadAndProcessImage } from '../services/api';

const PRESETS = [
  { id: 'clean', label: 'Ảnh sạch', desc: 'Nền trắng, chữ rõ', icon: '✨' },
  { id: 'noisy_light', label: 'Nhiễu nhẹ', desc: 'Đốm nhỏ, mờ nhẹ', icon: '🌫️' },
  { id: 'noisy_heavy', label: 'Nhiễu nặng', desc: 'Vệt đậm, đứt nét', icon: '⛈️' },
];

const PIPELINE_STEPS = [
  { id: 1, label: 'Làm sạch ảnh', sub: 'OpenCV Blur & Denoise' },
  { id: 2, label: 'Threshold', sub: 'Otsu / Adaptive' },
  { id: 3, label: 'Morphology', sub: 'Opening & Closing' },
  { id: 4, label: 'Bounding Box', sub: 'Connected Components' },
  { id: 5, label: 'CNN Predict', sub: 'Model inference' },
];

const ImageProcess = () => {
  const [step, setStep] = useState('UPLOAD');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultData, setResultData] = useState(null);
  const [preset, setPreset] = useState('clean');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [params, setParams] = useState({ threshold_mode: 'otsu', blur_kernel: 3, dilation_iter: 1, min_area: 100 });

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('CONFIG');
  };

  const handleStartProcess = async () => {
    setStep('PROCESSING');
    setPipelineStep(0);
    // Simulate step-by-step progress
    for (let i = 1; i <= 5; i++) {
      await new Promise((r) => setTimeout(r, 380));
      setPipelineStep(i);
    }
    try {
      const data = await uploadAndProcessImage(imageFile, { preset, ...params });
      setResultData(data);
      setStep('RESULT');
    } catch {
      alert('Có lỗi khi xử lý ảnh. Vui lòng thử lại.');
      setStep('CONFIG');
    }
  };

  const handleDownload = (type) => {
    const url = type === 'jpg' ? resultData.output_image_url : '#';
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'jpg' ? 'output.jpg' : 'output.txt';
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fadeIn">
      {/* Page header */}
      {step !== 'RESULT' && (
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#2dd4bf' }}>Xử lý ảnh</p>
          <h1 className="text-2xl font-black text-white">Nhận diện Ký tự Nhiễu</h1>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>Upload ảnh → Cấu hình → CNN nhận diện → Xuất kết quả</p>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === 'UPLOAD' && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>1</div>
              <h2 className="font-bold text-slate-200">Chọn ảnh đầu vào</h2>
            </div>
            <DragDropZone onImageSelect={handleImageSelect} />

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { icon: '🖤', title: 'Chữ đen nền trắng', ok: true },
                { icon: '📐', title: 'Kích thước đủ lớn', ok: true },
                { icon: '🎨', title: 'Ảnh màu phức tạp', ok: false },
              ].map((h, i) => (
                <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'rgba(7,21,38,0.5)', border: `1px solid ${h.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                  <p className="text-lg mb-1">{h.icon}</p>
                  <p className="text-[11px] font-semibold" style={{ color: h.ok ? '#86efac' : '#fca5a5' }}>
                    {h.ok ? '✓' : '✗'} {h.title}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIG */}
      {step === 'CONFIG' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>1</div>
              <h2 className="font-bold text-slate-200 text-sm">Ảnh đầu vào</h2>
            </div>
            <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#040d1a', border: '1px solid rgba(56,189,248,0.08)', minHeight: '180px' }}>
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-64 object-contain" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#38bdf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-xs truncate" style={{ color: '#64748b' }}>{imageFile?.name} · {(imageFile?.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={() => setStep('UPLOAD')}
              className="mt-3 w-full text-xs font-semibold py-2 rounded-lg transition-all hover:text-slate-300"
              style={{ color: '#475569' }}
            >
              ← Chọn ảnh khác
            </button>
          </div>

          {/* Config panel */}
          <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>2</div>
              <h2 className="font-bold text-slate-200 text-sm">Cấu hình tham số</h2>
            </div>

            {/* Preset */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-3 block" style={{ color: '#64748b' }}>Chế độ xử lý nhiễu</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className="p-3 rounded-xl text-center transition-all duration-200"
                    style={{
                      background: preset === p.id ? 'rgba(13,148,136,0.15)' : 'rgba(7,21,38,0.5)',
                      border: `1px solid ${preset === p.id ? 'rgba(45,212,191,0.4)' : 'rgba(56,189,248,0.1)'}`,
                    }}
                  >
                    <span className="text-xl block mb-1">{p.icon}</span>
                    <p className="text-[11px] font-bold" style={{ color: preset === p.id ? '#2dd4bf' : '#e2e8f0' }}>{p.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#475569' }}>{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="flex items-center justify-between w-full text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              style={{ background: 'rgba(56,189,248,0.06)', color: '#64748b', border: '1px solid rgba(56,189,248,0.1)' }}
            >
              <span>Tham số nâng cao</span>
              <svg
                className="w-4 h-4 transition-transform"
                style={{ transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: '#38bdf8' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              ><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {advancedOpen && (
              <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                {[
                  { key: 'threshold_mode', label: 'Threshold Mode', type: 'select', opts: [['otsu','Otsu'],['adaptive','Adaptive'],['global','Global']] },
                  { key: 'blur_kernel', label: 'Blur Kernel', type: 'number', min: 1, max: 9, step: 2 },
                  { key: 'dilation_iter', label: 'Dilation Iter', type: 'number', min: 0, max: 5, step: 1 },
                  { key: 'min_area', label: 'Min Area (px²)', type: 'number', min: 10, max: 1000, step: 10 },
                ].map(({ key, label, type, opts, ...rest }) => (
                  <div key={key}>
                    <label className="text-[11px] font-bold block mb-1.5" style={{ color: '#64748b' }}>{label}</label>
                    {type === 'select' ? (
                      <select
                        value={params[key]}
                        onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                        className="w-full py-2 px-3 text-xs font-medium rounded-lg outline-none"
                        style={{ background: 'rgba(7,21,38,0.8)', color: '#e2e8f0', border: '1px solid rgba(56,189,248,0.2)' }}
                      >
                        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={params[key]}
                        onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
                        className="w-full py-2 px-3 text-xs font-medium rounded-lg outline-none"
                        style={{ background: 'rgba(7,21,38,0.8)', color: '#e2e8f0', border: '1px solid rgba(56,189,248,0.2)' }}
                        {...rest}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleStartProcess}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(90deg, #0d3d6b, #0d9488)', color: 'white', boxShadow: '0 6px 20px rgba(13,148,136,0.35)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Tiến hành Nhận diện
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PROCESSING */}
      {step === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 rounded-full" style={{ border: '3px solid rgba(56,189,248,0.1)' }} />
            <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid transparent', borderTopColor: '#38bdf8' }} />
            <div className="absolute inset-3 rounded-full animate-spin" style={{ border: '2px solid transparent', borderTopColor: '#2dd4bf', animationDirection: 'reverse', animationDuration: '0.7s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-7 h-7" style={{ color: '#0d9488' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-black text-white mb-2">Đang chạy Pipeline...</h2>
          <p className="text-sm mb-10" style={{ color: '#475569' }}>OpenCV đang xử lý — CNN đang dự đoán ký tự</p>

          <div className="w-full max-w-sm space-y-2">
            {PIPELINE_STEPS.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500"
                style={{
                  background: pipelineStep >= s.id ? 'rgba(13,148,136,0.12)' : 'rgba(13,30,60,0.4)',
                  border: `1px solid ${pipelineStep >= s.id ? 'rgba(45,212,191,0.3)' : 'rgba(56,189,248,0.08)'}`,
                  opacity: pipelineStep >= s.id || pipelineStep === s.id - 1 ? 1 : 0.4,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{
                    background: pipelineStep >= s.id ? '#0d9488' : 'rgba(56,189,248,0.08)',
                    color: pipelineStep >= s.id ? 'white' : '#334155',
                  }}
                >
                  {pipelineStep >= s.id ? '✓' : s.id}
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: pipelineStep >= s.id ? '#2dd4bf' : '#64748b' }}>{s.label}</p>
                  <p className="text-[10px]" style={{ color: '#334155' }}>{s.sub}</p>
                </div>
                {pipelineStep === s.id - 1 && (
                  <div className="ml-auto w-3 h-3 rounded-full animate-pulse" style={{ background: '#38bdf8' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: RESULT */}
      {step === 'RESULT' && resultData && (
        <div className="space-y-5 animate-fadeIn">
          {/* Result header */}
          <div
            className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
            style={{ background: 'linear-gradient(120deg, #0a2244, #0d3d6b 50%, #083d38 100%)', border: '1px solid rgba(56,189,248,0.2)' }}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
                {resultData.result_id}
              </span>
              <h2 className="text-xl font-black text-white mt-2">Phân tích hoàn tất!</h2>
              <p className="text-xs mt-1" style={{ color: '#475569' }}>{resultData.filename} · {resultData.processing_time_ms}ms</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownload('jpg')}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}
              >
                ↓ output.jpg
              </button>
              <button
                onClick={() => handleDownload('txt')}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}
              >
                ↓ output.txt
              </button>
              <button
                onClick={() => setStep('UPLOAD')}
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{ background: 'rgba(13,148,136,0.2)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)' }}
              >
                + Phân tích ảnh mới
              </button>
            </div>
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #2dd4bf, transparent)' }} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ký tự tìm thấy', value: resultData.statistics.detected_boxes, color: '#38bdf8' },
              { label: 'Avg Confidence', value: `${(resultData.statistics.average_confidence * 100).toFixed(0)}%`, color: '#2dd4bf' },
              { label: 'Nhiễu loại bỏ', value: resultData.statistics.removed_components, color: '#818cf8' },
              { label: 'Thời gian xử lý', value: `${resultData.processing_time_ms}ms`, color: '#fde047' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: 'rgba(13,30,60,0.6)', border: '1px solid rgba(56,189,248,0.1)' }}>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] mt-1" style={{ color: '#475569' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Main result grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-5">
              {/* Output image */}
              <div className="rounded-2xl p-5" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
                <h3 className="font-bold text-slate-200 text-sm mb-4">Ảnh kết quả (Bounding Box)</h3>
                <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#040d1a', border: '1px solid rgba(56,189,248,0.08)', minHeight: '160px' }}>
                  <img src={resultData.output_image_url} alt="Output" className="w-full h-auto object-contain" />
                </div>
                {/* LLM comment */}
                <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(45,212,191,0.15)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg className="w-3.5 h-3.5" style={{ color: '#2dd4bf' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#2dd4bf' }}>Trợ lý AI nhận xét</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{resultData.llm_comment}</p>
                </div>
              </div>

              <ImageTabs />
            </div>

            <BoundingBoxTable boxes={resultData.boxes} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageProcess;
