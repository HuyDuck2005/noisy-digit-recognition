// src/pages/ImageProcess.jsx
import React, { useState } from 'react';
// import DragDropZone from '../components/Upload/DragDropZone';
// Bỏ comment import DragDropZone khi bạn đã tạo file đó. Tạm thời dùng div mô phỏng bên dưới.
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
  const [step, setStep] = useState('UPLOAD'); // UPLOAD, PROCESSING, RESULT
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Params state
  const [selectedPreset, setSelectedPreset] = useState('noisy_light');
  const [binaryThreshold, setBinaryThreshold] = useState(128);
  const [minArea, setMinArea] = useState(50);
  const [padding, setPadding] = useState(4);
  
  // Result state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null);
  const [activeTab, setActiveTab] = useState('output'); // output, table, raw

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStep('UPLOAD');
      setResultData(null);
      setError('');
    }
  };

  const handlePresetSelect = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId === 'clean') { setBinaryThreshold(150); setMinArea(30); setPadding(2); }
    if (presetId === 'noisy_light') { setBinaryThreshold(128); setMinArea(50); setPadding(4); }
    if (presetId === 'noisy_heavy') { setBinaryThreshold(100); setMinArea(80); setPadding(6); }
  };

  const handleProcess = async () => {
    if (!imageFile) {
      setError('Vui lòng chọn một ảnh để xử lý.');
      return;
    }

    setStep('PROCESSING');
    setLoading(true);
    setError('');

    try {
      // Gọi API thực tế
      // const data = await uploadAndProcessImage(imageFile, { binaryThreshold, minArea, padding });
      
      // MÔ PHỎNG DELAY ĐỂ THẤY UI LOADING (Xóa đoạn setTimeout này khi ghép API thật)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const data = {
        success: true,
        output_image_url: previewUrl, // Dùng tạm ảnh gốc làm ảnh kết quả
        predictions: [
          { char: '8', confidence: 0.98, box: { x: 10, y: 15, w: 28, h: 28 } },
          { char: '3', confidence: 0.85, box: { x: 45, y: 16, w: 28, h: 28 } }
        ],
        llm_feedback: "Ảnh có mức độ nhiễu hạt (Salt & Pepper) trung bình. Ký tự '8' nét đứt đã được nối lại qua phép Dilation. Khuyến nghị tăng Min Area lên 60 nếu vẫn còn nhận diện nhầm các cụm nhiễu nhỏ."
      };

      setResultData(data);
      setStep('RESULT');
    } catch (err) {
      setError('Lỗi khi xử lý ảnh. Vui lòng thử lại.');
      setStep('UPLOAD');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setPreviewUrl('');
    setResultData(null);
    setStep('UPLOAD');
    setError('');
  };

  return (
    <div className="flex flex-col gap-8 anim-in">
      
      {/* Tiêu đề trang */}
      <div>
        <h2 className="page-eyebrow">Workspace</h2>
        <h1 className="page-title">Xử lý & Nhận diện Kí tự</h1>
        <p className="page-sub">Tải ảnh lên và tinh chỉnh tham số để nhận diện chữ số nhiễu.</p>
      </div>

      {/* Main Layout 2 Cột */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ================= CỘT TRÁI (5 phần): UPLOAD & PARAMS ================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Card Upload */}
          <div className="card">
            <h3 className="card-title">1. Tải ảnh đầu vào</h3>
            <p className="card-sub mb-4">Hỗ trợ JPG, PNG. Tối đa 5MB.</p>
            
            <div className="relative w-full h-48 border-2 border-dashed border-sky-500/30 rounded-xl flex flex-col items-center justify-center bg-[rgba(56,189,248,0.03)] hover:bg-[rgba(56,189,248,0.08)] transition-all cursor-pointer overflow-hidden group">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📤</div>
                  <span className="text-teal font-bold text-sm">Nhấp hoặc Kéo thả ảnh vào đây</span>
                </div>
              )}
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageSelect} accept="image/png, image/jpeg" />
            </div>
            
            {error && <p className="text-red-400 text-sm mt-3 font-medium bg-red-400/10 p-2 rounded-lg border border-red-400/20">{error}</p>}
          </div>

          {/* Card Cấu Hình */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">2. Cấu hình Tham số</h3>
              <span className="badge badge-blue">OpenCV</span>
            </div>

            {/* Presets */}
            <div className="mb-6">
              <label className="form-label">Chọn Mẫu nhanh (Presets)</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id)}
                    className={`btn btn-sm flex-col py-3 h-auto gap-1 ${selectedPreset === p.id ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <span className="text-lg">{p.icon}</span>
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="divider"></div>

            {/* Params Sliders */}
            <div className="flex flex-col gap-5">
              <div>
                <label className="form-label">Binary Threshold ({binaryThreshold})</label>
                <input type="range" className="w-full accent-teal-500" min="0" max="255" value={binaryThreshold} onChange={(e) => setBinaryThreshold(e.target.value)} />
                <div className="flex justify-between text-xs text-muted mt-1"><span>0 (Đen)</span><span>255 (Trắng)</span></div>
              </div>

              <div>
                <label className="form-label">Min Area Lọc nhiễu ({minArea}px)</label>
                <input type="range" className="w-full accent-sky-500" min="10" max="200" value={minArea} onChange={(e) => setMinArea(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Padding (Viền ký tự)</label>
                <select className="form-select" value={padding} onChange={(e) => setPadding(e.target.value)}>
                  <option value="0">Sát viền (0px)</option>
                  <option value="2">Hẹp (2px)</option>
                  <option value="4">Tiêu chuẩn (4px)</option>
                  <option value="6">Rộng (6px)</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleProcess} 
              disabled={loading || !imageFile}
              className={`btn btn-lg w-full mt-6 ${loading ? 'opacity-70 cursor-not-allowed bg-slate-700' : 'btn-primary'}`}
            >
              {loading ? <span className="spin">⏳ Đang xử lý...</span> : '⚡ Chạy Pipeline Xử lý'}
            </button>
          </div>
        </div>

        {/* ================= CỘT PHẢI (7 phần): TRẠNG THÁI & KẾT QUẢ ================= */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {step === 'UPLOAD' && (
            <div className="card h-full flex flex-col items-center justify-center text-center opacity-70 min-h-[400px]">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4 border border-slate-700">🖼️</div>
              <h3 className="text-lg font-bold text-slate-300">Chưa có dữ liệu xử lý</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">Hãy tải ảnh lên và nhấn "Chạy Pipeline Xử lý" bên cột trái để xem kết quả nhận diện, bounding box và nhận xét từ AI.</p>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="card card-glow h-full min-h-[400px] flex flex-col justify-center">
              <h3 className="card-title text-center text-teal mb-8">Đang chạy thuật toán...</h3>
              <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
                {PIPELINE_STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 bg-[rgba(5,15,30,0.5)] p-3 rounded-lg border border-sky-500/10 anim-in" style={{ animationDelay: `${i * 0.2}s` }}>
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal flex items-center justify-center font-bold text-sm border border-teal-500/30">
                      {s.id}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-200">{s.label}</div>
                      <div className="text-xs text-slate-500">{s.sub}</div>
                    </div>
                    {/* Giả lập trạng thái load từng bước */}
                    <div className="ml-auto text-teal spin">⏳</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'RESULT' && resultData && (
            <div className="card card-glow anim-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="card-title text-teal">Kết quả phân tích</h3>
                <button onClick={handleReset} className="btn btn-sm btn-ghost text-xs">↻ Xử lý ảnh mới</button>
              </div>
              
              {/* Nút Tabs */}
              <div className="flex gap-2 border-b border-sky-500/20 pb-4 mb-6">
                <button onClick={() => setActiveTab('output')} className={`btn btn-sm ${activeTab === 'output' ? 'btn-primary' : 'btn-ghost'}`}>🖼️ Ảnh Bounding Box</button>
                <button onClick={() => setActiveTab('table')} className={`btn btn-sm ${activeTab === 'table' ? 'btn-primary' : 'btn-ghost'}`}>📊 Bảng Tọa độ</button>
                <button className="btn btn-sm btn-ghost ml-auto text-sky hover:text-white">⬇️ Tải Output.txt</button>
              </div>

              {/* Nội dung Tab Ảnh */}
              {activeTab === 'output' && (
                <div className="flex flex-col gap-4">
                  <div className="bg-[#040d1a] border border-sky-500/20 rounded-xl overflow-hidden flex items-center justify-center min-h-[250px] p-2">
                    <img src={resultData.output_image_url} alt="Output" className="w-full max-h-[400px] object-contain rounded-lg" />
                  </div>
                  
                  {/* LLM Feedback Block */}
                  <div className="bg-[rgba(13,148,136,0.1)] border border-[rgba(45,212,191,0.25)] rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-teal font-black text-lg">✨ AI Assistant</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{resultData.llm_feedback}</p>
                  </div>
                </div>
              )}

              {/* Nội dung Tab Bảng */}
              {activeTab === 'table' && (
                <div className="overflow-x-auto rounded-xl border border-sky-500/20">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nhãn (Dự đoán)</th>
                        <th>Độ tin cậy</th>
                        <th>Tọa độ (X, Y, W, H)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.predictions?.map((pred, idx) => (
                        <tr key={idx}>
                          <td><span className="badge badge-teal text-sm px-3">{pred.char}</span></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500" style={{ width: `${pred.confidence * 100}%` }}></div>
                              </div>
                              <span className="text-sm">{(pred.confidence * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="text-sm font-mono text-sky">
                            [{pred.box.x}, {pred.box.y}, {pred.box.w}, {pred.box.h}]
                          </td>
                        </tr>
                      ))}
                      {(!resultData.predictions || resultData.predictions.length === 0) && (
                        <tr><td colSpan="3" className="text-center py-6 text-slate-500">Không tìm thấy ký tự nào.</td></tr>
                      )}
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