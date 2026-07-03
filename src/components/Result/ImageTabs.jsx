import React, { useEffect, useMemo, useState } from 'react';

const TAB_CONFIG = [
  ['original_url', 'Gốc', 'Ảnh upload / ảnh đã resize'],
  ['grayscale_url', 'Ảnh xám', 'Ảnh một kênh (grayscale)'],
  ['contrast_url', 'Tương phản', 'Ảnh đã tăng tương phản (contrast)'],
  ['illumination_url', 'Ánh sáng', 'Ảnh đã sửa nền sáng không đều (illumination)'],
  ['denoised_url', 'Khử nhiễu', 'Ảnh đã giảm nhiễu (denoised)'],
  ['sharpened_url', 'Tăng nét', 'Ảnh đã tăng nét stroke'],
  ['edge_map_url', 'Biên nét', 'Bản đồ biên / nét chữ (edge map)'],
  ['dog_url', 'DoG', 'Nhánh Difference of Gaussian'],
  ['log_url', 'LoG', 'Nhánh Laplacian of Gaussian'],
  ['gabor_response_url', 'Gabor', 'Phản hồi stroke từ Gabor'],
  ['gabor_binary_url', 'Gabor mask', 'Mask Gabor sau threshold'],
  ['binary_url', 'Binary', 'Mask foreground chính'],
  ['binary_otsu_url', 'Otsu', 'Nhánh ngưỡng Otsu'],
  ['binary_adaptive_url', 'Adaptive', 'Nhánh adaptive threshold'],
  ['binary_sauvola_url', 'Sauvola', 'Nhánh Sauvola threshold'],
  ['binary_niblack_url', 'Niblack', 'Nhánh Niblack threshold'],
  ['morphology_url', 'Morphology', 'Mask đã xử lý hình thái học'],
  ['line_mask_url', 'Line mask', 'Đường ngang/dọc phát hiện được'],
  ['no_lines_url', 'No lines', 'Mask sau khi xóa đường kẻ'],
  ['components_url', 'Components', 'Visualization của connected components'],
  ['mser_regions_url', 'MSER', 'Visualization của MSER proposals'],
  ['fused_boxes_url', 'Fused bbox', 'BBox đã gộp/fusion'],
  ['output_url', 'Output', 'BBox ứng viên cuối cùng'],
].map(([id, label, desc]) => ({ id, label, desc }));

const ImageTabs = ({ pipelineImages }) => {
  const tabs = useMemo(
    () => TAB_CONFIG.map((tab) => ({ ...tab, url: pipelineImages?.[tab.id] || '' })),
    [pipelineImages],
  );
  const firstAvailable = tabs.find((tab) => tab.url)?.id || TAB_CONFIG[0].id;
  const [active, setActive] = useState(firstAvailable);

  useEffect(() => {
    setActive(firstAvailable);
  }, [firstAvailable]);

  const activeTab = tabs.find((tab) => tab.id === active) || tabs[0];

  if (!pipelineImages) {
    return (
      <div className="card text-center" style={{ padding: 28 }}>
        <h3 className="card-title">Ảnh pipeline</h3>
        <p className="card-sub mt-2">Chạy Advanced Classical CV để tạo ảnh trung gian.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        <h3 className="font-bold text-slate-200 text-sm">Ảnh từng bước pipeline</h3>
        <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>Tab mờ nghĩa là bước đó chưa được tạo với tham số hiện tại.</p>
      </div>

      <div className="flex gap-1 p-2 overflow-x-auto" style={{ background: 'rgba(7,21,38,0.5)', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => tab.url && setActive(tab.id)}
            disabled={!tab.url}
            className="min-w-[96px] flex flex-col items-center py-2 px-2 rounded-xl text-center transition-all duration-200 disabled:opacity-35 disabled:cursor-not-allowed"
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
        <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#040d1a', minHeight: 260, border: '1px solid rgba(56,189,248,0.08)' }}>
          {activeTab?.url ? (
            <img src={activeTab.url} alt={activeTab.label} className="w-full h-auto object-contain animate-fadeIn" style={{ maxHeight: 420 }} />
          ) : (
            <p className="text-sm text-slate-500">Bước này chưa được tạo với tham số hiện tại.</p>
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
