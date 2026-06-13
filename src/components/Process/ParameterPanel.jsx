import React from 'react';

const ParameterPanel = () => {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="card-title">Cấu hình thuật toán</h3>
        <span className="badge badge-blue">OpenCV</span>
      </div>
      
      <div className="flex flex-col gap-4">
        <div>
          <label className="form-label">Binary Threshold</label>
          <div className="flex gap-4 items-center">
            <input type="range" className="w-full cursor-pointer accent-teal-500" min="0" max="255" defaultValue="128" />
            <span className="text-white font-bold w-12 text-right">128</span>
          </div>
        </div>

        <div>
          <label className="form-label">Min Area (Lọc nhiễu)</label>
          <input type="number" className="form-input" placeholder="Ví dụ: 50" defaultValue="50" />
        </div>

        <div>
          <label className="form-label">Padding Ký tự</label>
          <select className="form-select">
            <option>Tiêu chuẩn (4px)</option>
            <option>Mở rộng (8px)</option>
            <option>Sát viền (0px)</option>
          </select>
        </div>
      </div>

      <div className="divider"></div>
      <button className="btn btn-primary w-full">Áp dụng & Chạy Model</button>
    </div>
  );
};

export default ParameterPanel;