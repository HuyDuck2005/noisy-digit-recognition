// src/components/Result/ImageTabs.jsx
import React, { useState } from 'react';

const ImageTabs = ({ pipelineImages }) => {
  const [activeTab, setActiveTab] = useState('binary');

  // Danh sách các bước trong pipeline đúng theo đặc tả cấu trúc ảnh trung gian
  const tabs = [
    { id: 'original', name: 'Ảnh Gốc', desc: 'Ảnh đầu vào của người dùng' },
    { id: 'grayscale', name: 'Ảnh Xám', desc: 'Chuyển màu để giảm độ phức tạp tính toán' },
    { id: 'binary', name: 'Nhị Phân (Threshold)', desc: 'Phân tách Foreground và Background bằng Otsu/Adaptive' },
    { id: 'morphology', name: 'Morphology', desc: 'Xử lý Opening/Closing để xóa nhiễu và nối nét đứt' },
    { id: 'components', name: 'Connected Components', desc: 'Tách biệt và gán nhãn màu các vùng liên thông ký tự' },
  ];

  // Mock dữ liệu ảnh trung gian dạng placeholder màu sắc trực quan
  const mockImages = pipelineImages || {
    original: 'https://via.placeholder.com/512x256/0f172a/ffffff?text=1.+Original+Image',
    grayscale: 'https://via.placeholder.com/512x256/334155/ffffff?text=2.+Grayscale+Pipeline',
    binary: 'https://via.placeholder.com/512x256/000000/ffffff?text=3.+Binary+Threshold+(Otsu)',
    morphology: 'https://via.placeholder.com/512x256/1e293b/ffffff?text=4.+Morphology+Cleaned',
    components: 'https://via.placeholder.com/512x256/0f766e/ffffff?text=5.+Connected+Components+Colored',
  };

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-1">Pipeline Xử Lý Ảnh Trung Gian</h3>
      <p className="text-xs text-gray-500 mb-4">Trực quan hóa từng bước thuật toán OpenCV chạy ngầm dưới backend.</p>
      
      {/* Thanh chuyển Tab bo tròn mịn màng */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 rounded-xl mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-slate-900 to-cyan-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Vùng hiển thị ảnh kết quả tương ứng */}
      <div className="space-y-3">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-slate-950 flex items-center justify-center p-2">
          <img 
            src={mockImages[activeTab]} 
            alt={activeTab} 
            className="max-w-full h-auto rounded-lg object-contain transition-all duration-500 transform hover:scale-105" 
          />
        </div>
        <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border-left-2 border-cyan-500">
          * {tabs.find(t => t.id === activeTab)?.desc}
        </p>
      </div>
    </div>
  );
};

export default ImageTabs;