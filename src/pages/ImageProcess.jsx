import React, { useState } from 'react';
import { uploadAndProcessImage } from '../services/api';

const PRESETS = [
  { id: 'clean',       label: 'Ảnh sạch',  desc: 'Nền trắng, chữ rõ',  icon: '✨' },
  { id: 'noisy_light', label: 'Nhiễu nhẹ', desc: 'Đốm nhỏ, mờ nhẹ',   icon: '🌫️' },
  { id: 'noisy_heavy', label: 'Nhiễu nặng', desc: 'Vệt đậm, đứt nét',  icon: '⛈️' },
];

const PIPELINE_STEPS = [
  { id: 1, label: 'Làm sạch ảnh',  sub: 'OpenCV Blur & Denoise' },
  { id: 2, label: 'Threshold',      sub: 'Otsu / Adaptive' },
  { id: 3, label: 'Morphology',     sub: 'Opening & Closing' },
  { id: 4, label: 'Bounding Box',   sub: 'Connected Components' },
  { id: 5, label: 'CNN Predict',    sub: 'Model inference' },
];

const confidenceBadge = (conf) => {
  if (conf >= 0.85) return { label: 'High',   color: '#86efac', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.3)' };
  if (conf >= 0.60) return { label: 'Medium', color: '#fde047', bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.3)' };
  return               { label: 'Low',    color: '#fca5a5', bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)' };
};

const ImageProcess = () => {
  const [step, setStep]               = useState('UPLOAD');
  const [imageFile, setImageFile]     = useState(null);
  const [previewUrl, setPreviewUrl]   = useState('');
  const [selectedPreset, setPreset]   = useState('noisy_light');
  const [binaryThreshold, setThresh]  = useState(128);
  const [minArea, setMinArea]         = useState(50);
  const [padding, setPadding]         = useState(4);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [resultData, setResultData]   = useState(null);
  const [activeTab, setActiveTab]     = useState('output');

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('UPLOAD');
    setResultData(null);
    setError('');
  };

  const handlePresetSelect = (id) => {
    setPreset(id);
    if (id === 'clean')       { setThresh(150); setMinArea(30); setPadding(2); }
    if (id === 'noisy_light') { setThresh(128); setMinArea(50); setPadding(4); }
    if (id === 'noisy_heavy') { setThresh(100); setMinArea(80); setPadding(6); }
  };

  const handleProcess = async () => {
    if (!imageFile) { setError('Vui lòng chọn một ảnh để xử lý.'); return; }
    setStep('PROCESSING'); setLoading(true); setError('');
    try {
      await new Promise(r => setTimeout(r, 2000));
      const data = {
        success: true,
        output_image_url: previewUrl,
        predictions: [
          { char: '8', confidence: 0.98, box: { x: 10, y: 15, w: 28, h: 28 } },
          { char: '3', confidence: 0.72, box: { x: 45, y: 16, w: 28, h: 28 } },
          { char: 'A', confidence: 0.45, box: { x: 80, y: 16, w: 28, h: 28 } },
        ],
        llm_feedback: "Ảnh có mức độ nhiễu hạt (Salt & Pepper) trung bình. Ký tự '8' nét đứt đã được nối lại qua phép Dilation. Khuyến nghị tăng Min Area lên 60 nếu vẫn còn nhận diện nhầm các cụm nhiễu nhỏ.",
      };
      setResultData(data);
      setStep('RESULT');
    } catch {
      setError('Lỗi khi xử lý ảnh. Vui lòng thử lại.');
      setStep('UPLOAD');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null); setPreviewUrl('');
    setResultData(null); setStep('UPLOAD'); setError('');
  };

  const handleDownload = () => {
    if (!resultData) return;
    const lines = resultData.predictions.map(
      (p, i) => `${i + 1}\t${p.char}\t${(p.confidence * 100).toFixed(1)}%\t[${p.box.x},${p.box.y},${p.box.w},${p.box.h}]`
    );
    const content = `NoisyDigits Output\n==================\n` + lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'output.txt';
    a.click();
  };

  const handleDownloadImage = () => {
    if (!resultData?.output_image_url) return;
    const a = document.createElement('a');
    a.href = resultData.output_image_url;
    a.download = 'output.jpg';
    a.click();
  };

  return (
    <div className="flex flex-col gap-6 anim-in">

      {/* Tiêu đề */}
      <div>
        <h2 className="page-eyebrow">Workspace</h2>
        <h1 className="page-title">Xử lý & Nhận diện Kí tự</h1>
        <p className="page-sub">Tải ảnh lên, tinh chỉnh tham số và chạy pipeline nhận diện.</p>
      </div>

      {/* Layout 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ===== CỘT TRÁI: Upload + Params ===== */}
        <div className="lg:col-span-4 flex flex-col gap-5">

          {/* Upload card */}
          <div className="card" style={{ padding: 20 }}>
            <h3 className="card-title" style={{ fontSize: 16, marginBottom: 4 }}>1. Tải ảnh đầu vào</h3>
            <p className="card-sub" style={{ marginBottom: 12 }}>JPG / PNG · Tối đa 5MB</p>

            <div
              className="relative border-2 border-dashed border-sky-500/30 rounded-xl flex flex-col items-center justify-center bg-[rgba(56,189,248,0.03)] hover:bg-[rgba(56,189,248,0.08)] transition-all cursor-pointer overflow-hidden group"
              style={{ height: previewUrl ? 160 : 120 }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">📤</div>
                  <span className="text-teal font-bold text-sm">Nhấp hoặc kéo thả ảnh vào đây</span>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageSelect} accept="image/png,image/jpeg" />
            </div>

            {imageFile && (
              <p className="text-xs text-slate-400 mt-2 truncate">📎 {imageFile.name}</p>
            )}
            {error && (
              <p className="text-red-400 text-sm mt-2 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          {/* Params card */}
          <div className="card" style={{ padding: 20 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
              <h3 className="card-title" style={{ fontSize: 16 }}>2. Cấu hình tham số</h3>
              <span className="badge badge-blue" style={{ fontSize: 11 }}>OpenCV</span>
            </div>

            {/* Presets */}
            <label className="form-label">Preset nhanh</label>
            <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 16 }}>
              {PRESETS.map(p => (
                <button key={p.id} onClick={() => handlePresetSelect(p.id)}
                  className={`btn btn-sm flex-col h-auto gap-1 ${selectedPreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '8px 4px' }}>
                  <span style={{ fontSize: 16 }}>{p.icon}</span>
                  <span style={{ fontSize: 11 }}>{p.label}</span>
                </button>
              ))}
            </div>

            <div className="divider" />

            {/* Sliders */}
            <div className="flex flex-col gap-4" style={{ marginTop: 12 }}>
              <div>
                <label className="form-label">Binary Threshold ({binaryThreshold})</label>
                <input type="range" className="w-full accent-teal-500" min="0" max="255"
                  value={binaryThreshold} onChange={e => setThresh(+e.target.value)} />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0 (Tối)</span><span>255 (Sáng)</span>
                </div>
              </div>
              <div>
                <label className="form-label">Min Area ({minArea} px²)</label>
                <input type="range" className="w-full accent-sky-500" min="10" max="200"
                  value={minArea} onChange={e => setMinArea(+e.target.value)} />
              </div>
              <div>
                <label className="form-label">Padding viền ký tự</label>
                <select className="form-select" value={padding} onChange={e => setPadding(+e.target.value)}>
                  <option value="0">Sát viền (0px)</option>
                  <option value="2">Hẹp (2px)</option>
                  <option value="4">Tiêu chuẩn (4px)</option>
                  <option value="6">Rộng (6px)</option>
                </select>
              </div>
            </div>

            <button onClick={handleProcess} disabled={loading || !imageFile}
              className={`btn w-full mt-5 ${loading || !imageFile ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}
              style={{ padding: '13px 0' }}>
              {loading ? '⏳ Đang xử lý...' : '⚡ Chạy Pipeline Xử lý'}
            </button>
          </div>
        </div>

        {/* ===== CỘT PHẢI: Kết quả ===== */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* Trạng thái chờ */}
          {step === 'UPLOAD' && (
            <div className="card flex flex-col items-center justify-center text-center opacity-60"
              style={{ minHeight: 320, padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
              <h3 style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
                Chưa có kết quả
              </h3>
              <p style={{ color: '#64748b', fontSize: 14, maxWidth: 320 }}>
                Chọn ảnh và nhấn "Chạy Pipeline Xử lý" để bắt đầu nhận diện ký tự.
              </p>
            </div>
          )}

          {/* Đang xử lý */}
          {step === 'PROCESSING' && (
            <div className="card card-glow flex flex-col justify-center" style={{ minHeight: 320, padding: 32 }}>
              <h3 className="text-teal text-center font-bold" style={{ fontSize: 18, marginBottom: 24 }}>
                Đang chạy thuật toán...
              </h3>
              <div className="flex flex-col gap-3 max-w-sm mx-auto w-full">
                {PIPELINE_STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3 anim-in"
                    style={{ background: 'rgba(5,15,30,0.5)', padding: '10px 14px', borderRadius: 10,
                      border: '1px solid rgba(56,189,248,0.1)', animationDelay: `${i * 0.2}s` }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(45,212,191,0.15)',
                      border: '1px solid rgba(45,212,191,0.3)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#2dd4bf', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {s.id}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#e2e8f0' }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{s.sub}</div>
                    </div>
                    <span className="ml-auto spin" style={{ fontSize: 14 }}>⏳</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kết quả */}
          {step === 'RESULT' && resultData && (
            <div className="card card-glow anim-in" style={{ padding: 24 }}>

              {/* Header kết quả */}
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <h3 className="text-teal font-bold" style={{ fontSize: 18 }}>✅ Kết quả phân tích</h3>
                <button onClick={handleReset} className="btn btn-sm btn-ghost" style={{ fontSize: 12 }}>
                  ↻ Xử lý ảnh mới
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap" style={{ borderBottom: '1px solid rgba(56,189,248,0.15)', paddingBottom: 12, marginBottom: 16 }}>
                <button onClick={() => setActiveTab('output')}
                  className={`btn btn-sm ${activeTab === 'output' ? 'btn-primary' : 'btn-ghost'}`}>
                  🖼️ Ảnh kết quả
                </button>
                <button onClick={() => setActiveTab('table')}
                  className={`btn btn-sm ${activeTab === 'table' ? 'btn-primary' : 'btn-ghost'}`}>
                  📊 Bảng tọa độ
                </button>
                {/* Nút export */}
                <div className="flex gap-2 ml-auto">
                  <button onClick={handleDownloadImage} className="btn btn-sm btn-secondary" style={{ fontSize: 12 }}>
                    ⬇️ output.jpg
                  </button>
                  <button onClick={handleDownload} className="btn btn-sm btn-secondary" style={{ fontSize: 12 }}>
                    ⬇️ output.txt
                  </button>
                </div>
              </div>

              {/* Tab: Ảnh */}
              {activeTab === 'output' && (
                <div className="flex flex-col gap-4">
                  {/* So sánh ảnh gốc vs kết quả */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Ảnh gốc
                      </p>
                      <div style={{ background: '#040d1a', border: '1px solid rgba(56,189,248,0.15)',
                        borderRadius: 10, overflow: 'hidden', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={previewUrl} alt="Ảnh gốc"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 6 }} />
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: '#2dd4bf', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Kết quả (Bounding Box)
                      </p>
                      <div style={{ background: '#040d1a', border: '1px solid rgba(45,212,191,0.25)',
                        borderRadius: 10, overflow: 'hidden', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={resultData.output_image_url} alt="Output"
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', padding: 6 }} />
                      </div>
                    </div>
                  </div>

                  {/* LLM Feedback */}
                  <div style={{ background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(45,212,191,0.2)',
                    borderRadius: 12, padding: '14px 16px', borderLeft: '3px solid #2dd4bf' }}>
                    <div style={{ color: '#2dd4bf', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                      ✨ AI Assistant
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>{resultData.llm_feedback}</p>
                  </div>
                </div>
              )}

              {/* Tab: Bảng */}
              {activeTab === 'table' && (
                <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(56,189,248,0.15)' }}>
                  <table className="data-table" style={{ fontSize: 14 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Ký tự</th>
                        <th>Độ tin cậy</th>
                        <th>Mức</th>
                        <th>Tọa độ (X,Y,W,H)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.predictions?.map((pred, idx) => {
                        const badge = confidenceBadge(pred.confidence);
                        return (
                          <tr key={idx}>
                            <td style={{ color: '#64748b', fontSize: 12 }}>{idx + 1}</td>
                            <td>
                              <span className="badge badge-teal" style={{ fontSize: 15, fontWeight: 900 }}>
                                {pred.char}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                <div style={{ width: 60, height: 6, background: '#1e293b', borderRadius: 9999, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${pred.confidence * 100}%`, background: badge.color, borderRadius: 9999 }} />
                                </div>
                                <span style={{ fontSize: 13 }}>{(pred.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 9999,
                                background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                                {badge.label}
                              </span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#38bdf8' }}>
                              [{pred.box.x}, {pred.box.y}, {pred.box.w}, {pred.box.h}]
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ImageProcess;