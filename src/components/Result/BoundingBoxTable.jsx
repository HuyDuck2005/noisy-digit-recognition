// src/components/Result/BoundingBoxTable.jsx
import React, { useState } from 'react';

const BoundingBoxTable = ({ boxes }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [customLabels, setCustomLabels] = useState({});

  // Dữ liệu mẫu nếu component cha chưa truyền boxes xuống
  const defaultBoxes = boxes || [
    { index: 1, x: 12, y: 35, width: 24, height: 40, area: 960, label: '7', confidence: 0.94 },
    { index: 2, x: 80, y: 31, width: 22, height: 39, area: 858, label: 'A', confidence: 0.88 },
    { index: 3, x: 140, y: 29, width: 25, height: 42, area: 1050, label: 'B', confidence: 0.55 }, // Gặp ký tự độ tin cậy thấp
  ];

  const handleEditLabel = (index, val) => {
    setCustomLabels({ ...customLabels, [index]: val });
  };

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Bảng Tọa Độ & Nhãn Dự Đoán</h3>
          <p className="text-xs text-gray-500">Dữ liệu bounding box trích xuất từ CNN Model</p>
        </div>
        <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">
          Sắp xếp: Thứ tự đọc (Trái qua Phải)
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Mã</th>
              <th className="px-4 py-3 text-left font-semibold">Tọa độ (X,Y)</th>
              <th className="px-4 py-3 text-left font-semibold">Kích thước</th>
              <th className="px-4 py-3 text-left font-semibold">Độ tin cậy</th>
              <th className="px-4 py-3 text-center font-semibold">Nhãn gốc</th>
              <th className="px-4 py-3 text-center font-semibold">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {defaultBoxes.map((box) => {
              const isLowConf = box.confidence < 0.6;
              const displayLabel = customLabels[box.index] !== undefined ? customLabels[box.index] : box.label;
              const isEdited = customLabels[box.index] !== undefined;

              return (
                <tr key={box.index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-500">#{box.index}</td>
                  <td className="px-4 py-3 text-slate-700">{box.x}, {box.y}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{box.width} × {box.height} px</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Thanh phần trăm tiến trình chuyển màu ngọc thanh lịch */}
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${isLowConf ? 'bg-orange-500' : 'bg-gradient-to-r from-cyan-500 to-teal-400'}`}
                          style={{ width: `${box.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-bold ${isLowConf ? 'text-orange-600' : 'text-slate-700'}`}>
                        {(box.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingIndex === box.index ? (
                      <input 
                        type="text" 
                        maxLength={1}
                        value={displayLabel}
                        onChange={(e) => handleEditLabel(box.index, e.target.value)}
                        className="w-10 text-center border-2 border-cyan-500 rounded-md focus:outline-none text-sm p-0.5 font-bold"
                      />
                    ) : (
                      <span className={`inline-block font-bold px-2 py-0.5 rounded ${isEdited ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-900'}`}>
                        {displayLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingIndex === box.index ? (
                      <button 
                        onClick={() => setEditingIndex(null)}
                        className="text-xs font-bold text-teal-600 hover:underline"
                      >
                        Lưu
                      </button>
                    ) : (
                      <button 
                        onClick={() => setEditingIndex(box.index)}
                        className="text-xs text-cyan-600 hover:text-cyan-800 hover:underline font-medium"
                      >
                        Sửa nhãn
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BoundingBoxTable;