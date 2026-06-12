// src/pages/ImageProcess.jsx
import React, { useState } from 'react';
import DragDropZone from '../components/Upload/DragDropZone';
import ImageTabs from '../components/Result/ImageTabs';
import BoundingBoxTable from '../components/Result/BoundingBoxTable';
import { uploadAndProcessImage } from '../services/api';

const ImageProcess = () => {
  const [step, setStep] = useState('UPLOAD'); // Các trạng thái: UPLOAD, CONFIG, PROCESSING, RESULT
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultData, setResultData] = useState(null);

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('CONFIG');
  };

  const handleStartProcess = async () => {
    setStep('PROCESSING');
    try {
      const defaultParams = { threshold_mode: 'otsu', blur_kernel: 3 };
      const data = await uploadAndProcessImage(imageFile, defaultParams);
      setResultData(data);
      setStep('RESULT');
    } catch (error) {
      alert("Có lỗi xảy ra khi xử lý!");
      setStep('CONFIG');
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl font-sans text-slate-800">
      
      {/* HEADER ĐƠN GIẢN NẾU CHƯA CÓ KẾT QUẢ */}
      {step !== 'RESULT' && (
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-cyan-600">
            Xử lý Ký tự Nhiễu
          </h1>
          <p className="text-slate-500 font-medium">Hệ thống nhận diện bằng OpenCV & CNN</p>
        </div>
      )}

      {/* TRẠNG THÁI 1: KÉO THẢ ẢNH */}
      {step === 'UPLOAD' && (
        <div className="animate-fadeIn max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100/50">
            <DragDropZone onImageSelect={handleImageSelect} />
          </div>
        </div>
      )}

      {/* TRẠNG THÁI 2: CẤU HÌNH THAM SỐ */}
      {step === 'CONFIG' && (
        <div className="animate-fadeIn max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/2 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 w-full text-center">Ảnh đầu vào</h2>
             <img src={previewUrl} alt="Preview" className="w-full max-h-72 object-contain rounded-2xl" />
             <p className="mt-4 text-xs text-slate-500 font-medium">{imageFile?.name}</p>
          </div>
          
          <div className="w-full md:w-1/2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Cấu hình tham số</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Chế độ xử lý nhiễu (Preset)</label>
                <select className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all cursor-pointer">
                  <option value="clean">Ảnh sạch (Mặc định)</option>
                  <option value="noisy_light">Ảnh nhiễu nhẹ</option>
                  <option value="noisy_heavy">Ảnh nhiễu nặng</option>
                </select>
              </div>
              <button 
                onClick={handleStartProcess}
                className="w-full bg-gradient-to-r from-slate-900 to-cyan-600 hover:from-slate-800 hover:to-cyan-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                Tiến hành Nhận diện
              </button>
              <button 
                onClick={() => setStep('UPLOAD')} 
                className="w-full text-slate-500 hover:text-slate-800 text-sm font-semibold py-2 transition-colors"
              >
                Quay lại chọn ảnh khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRẠNG THÁI 3: ĐANG XỬ LÝ */}
      {step === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đang chạy Pipeline...</h2>
          <p className="text-slate-500 text-sm font-medium">OpenCV đang bóc tách nhiễu và CNN đang dự đoán ký tự</p>
        </div>
      )}

      {/* TRẠNG THÁI 4: KẾT QUẢ */}
      {step === 'RESULT' && resultData && (
        <div className="space-y-6 animate-fadeIn">
          {/* Thanh tiêu đề chính */}
          <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-600 text-white rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full font-semibold">
                Mã chạy: {resultData.result_id}
              </span>
              <h2 className="text-2xl font-bold mt-3">Phân tích hoàn tất thành công!</h2>
            </div>
            <button 
              onClick={() => setStep('UPLOAD')} 
              className="bg-white text-slate-900 font-bold py-2.5 px-6 rounded-xl hover:bg-cyan-50 transition-all text-sm active:scale-95 shadow-sm"
            >
              Phân tích ảnh mới
            </button>
          </div>
          
          {/* Bố cục chia hai khối cân đối */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Khối hiển thị ảnh kết quả chính */}
              <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm">
                <h3 className="font-bold mb-4 text-slate-800">Ảnh Kết Quả Hệ Thống (Bounding Box)</h3>
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center p-2">
                  <img src={resultData.output_image_url} alt="Result" className="w-full h-auto object-contain rounded-xl" />
                </div>
                
                {/* Hộp nhận xét tự động từ LLM */}
                <div className="mt-5 p-4 md:p-5 bg-gradient-to-br from-slate-50 to-cyan-50/50 border border-cyan-100/60 rounded-2xl text-sm text-slate-700 leading-relaxed">
                  <strong className="text-cyan-800 flex items-center gap-2 mb-2 text-xs uppercase tracking-wider font-extrabold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Trợ lý AI nhận xét:
                  </strong>
                  {resultData.llm_comment}
                </div>
              </div>

              {/* Khối hiển thị thanh tab ảnh thuật toán trung gian */}
              <ImageTabs />
            </div>

            {/* Khối hiển thị bảng dữ liệu tọa độ chi tiết */}
            <div className="h-full">
              <BoundingBoxTable boxes={resultData.boxes} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageProcess;