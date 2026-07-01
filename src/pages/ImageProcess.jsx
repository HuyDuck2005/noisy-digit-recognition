import React, { useMemo, useState } from 'react';
import ParameterPanel from '../components/Process/ParameterPanel';
import BoundingBoxTable from '../components/Result/BoundingBoxTable';
import ImageTabs from '../components/Result/ImageTabs';
import PipelineFeedback from '../components/Result/PipelineFeedback';
import DragDropZone from '../components/Upload/DragDropZone';
import { uploadAndProcessImage } from '../services/api';

export const HISTORY_STORAGE_KEY = 'noisy_digits_history';

export const DEFAULT_PARAMETERS = {
  resize_scale: 1.0,
  max_width: 1600,
  grayscale_mode: 'standard',
  contrast_method: 'clahe',
  clahe_clip_limit: 2.0,
  clahe_tile_grid_size: [8, 8],
  illumination_correction: 'none',
  illumination_kernel_size: 31,
  denoise_method: 'median',
  median_kernel: 3,
  gaussian_kernel: 3,
  gaussian_sigma: 0,
  bilateral_d: 7,
  bilateral_sigma_color: 50,
  bilateral_sigma_space: 50,
  nlm_h: 10,
  nlm_template_window_size: 7,
  nlm_search_window_size: 21,
  sharpen_method: 'none',
  unsharp_amount: 1.0,
  unsharp_sigma: 1.0,
  convolution_branch_enabled: true,
  edge_method: 'none',
  sobel_ksize: 3,
  laplacian_ksize: 3,
  log_sigma: 1.0,
  dog_sigma_small: 1.0,
  dog_sigma_large: 2.0,
  gabor_enabled: false,
  gabor_frequencies: [0.1, 0.2],
  gabor_angles: [0, 30, 60, 90, 120, 150],
  threshold_method: 'adaptive',
  manual_threshold: 128,
  adaptive_method: 'gaussian',
  adaptive_block_size: 31,
  adaptive_c: 11,
  sauvola_window_size: 25,
  sauvola_k: 0.2,
  niblack_window_size: 25,
  niblack_k: -0.2,
  invert: true,
  morphology_mode: 'open_close',
  kernel_shape: 'rect',
  kernel_size: [2, 2],
  opening_iterations: 1,
  closing_iterations: 1,
  dilation_iterations: 0,
  erosion_iterations: 0,
  remove_lines: false,
  line_removal_method: 'morphology',
  horizontal_line_kernel: 30,
  vertical_line_kernel: 30,
  hough_threshold: 80,
  hough_min_line_length: 30,
  hough_max_line_gap: 5,
  bbox_methods: ['connected_components'],
  connectivity: 8,
  mser_enabled: false,
  contours_enabled: false,
  min_area: 20,
  max_area: null,
  min_width: 2,
  min_height: 5,
  max_width_ratio: 0.5,
  max_height_ratio: 0.5,
  min_aspect_ratio: 0.05,
  max_aspect_ratio: 5.0,
  min_fill_ratio: 0.02,
  padding: 2,
  merge_close_boxes: true,
  merge_x_gap: 2,
  merge_y_overlap_ratio: 0.5,
  split_wide_boxes: false,
  wide_box_aspect_threshold: 1.8,
  multi_branch_enabled: false,
  box_fusion_iou_threshold: 0.3,
  nms_iou_threshold: 0.4,
  sort_reading_order: true,
};

const preset = (label, desc, patch) => ({ label, desc, parameters: { ...DEFAULT_PARAMETERS, ...patch } });

const PRESETS = {
  auto_optimal: preset('Auto tối ưu (Auto)', 'Cân bằng cho ảnh chưa rõ mức nhiễu. Bắt đầu từ preset này nếu chưa biết chọn gì.', {
    resize_scale: 1.5,
    contrast_method: 'clahe',
    denoise_method: 'median',
    threshold_method: 'adaptive',
    morphology_mode: 'open_close',
    merge_close_boxes: true,
    min_area: 25,
  }),
  clean_document: preset('Ảnh sạch (Clean)', 'Tài liệu rõ, nền sạch, ít nhiễu. Ưu tiên tốc độ và bbox gọn.', {
    threshold_method: 'otsu',
    contrast_method: 'clahe',
    denoise_method: 'none',
    morphology_mode: 'opening',
    min_area: 20,
  }),
  light_noise: preset('Nhiễu nhẹ (Light)', 'Có vài chấm đen/trắng nhỏ. Dùng median + adaptive threshold.', {
    threshold_method: 'adaptive',
    denoise_method: 'median',
    median_kernel: 3,
    morphology_mode: 'opening',
    min_area: 30,
  }),
  heavy_noise: preset('Nhiễu nặng (Heavy)', 'Ảnh nhiều chấm nhiễu, chữ vẫn tương đối rõ. Dùng NLM và lọc mạnh hơn.', {
    threshold_method: 'adaptive',
    denoise_method: 'nlm',
    nlm_h: 10,
    morphology_mode: 'open_close',
    opening_iterations: 1,
    closing_iterations: 1,
    min_area: 50,
  }),
  very_heavy_noise: preset('Rất nhiễu (Very Heavy)', 'Ảnh mờ/nhiễu mạnh. Phóng ảnh, Sauvola, multi-branch để tăng recall.', {
    resize_scale: 2.0,
    contrast_method: 'clahe',
    denoise_method: 'nlm',
    threshold_method: 'sauvola',
    morphology_mode: 'open_close',
    min_area: 60,
    multi_branch_enabled: true,
  }),
  table_lines: preset('Có bảng (Table Lines)', 'Ảnh có đường kẻ ngang/dọc. Bật line removal trước khi tìm bbox.', {
    threshold_method: 'adaptive',
    denoise_method: 'median',
    morphology_mode: 'open_close',
    remove_lines: true,
    line_removal_method: 'morphology',
    horizontal_line_kernel: 30,
    vertical_line_kernel: 30,
  }),
  thin_text: preset('Chữ mảnh (Thin Text)', 'Nét chữ mảnh, dễ đứt. Dùng bilateral + closing + dilation nhẹ.', {
    threshold_method: 'adaptive',
    denoise_method: 'bilateral',
    morphology_mode: 'closing',
    dilation_iterations: 1,
    min_area: 10,
  }),
  bold_sticky_text: preset('Chữ dính (Sticky)', 'Nét đậm, ký tự dễ dính nhau. Dùng erosion và đánh dấu bbox rộng.', {
    threshold_method: 'adaptive',
    denoise_method: 'median',
    morphology_mode: 'opening',
    erosion_iterations: 1,
    split_wide_boxes: true,
  }),
  edge_gabor: preset('Biên/Gabor (Edge)', 'Thử nghiệm cho chữ mờ hoặc nền texture. Dùng DoG, Gabor, contours.', {
    contrast_method: 'clahe',
    denoise_method: 'bilateral',
    edge_method: 'dog',
    gabor_enabled: true,
    threshold_method: 'adaptive',
    bbox_methods: ['connected_components', 'contours'],
    contours_enabled: true,
    multi_branch_enabled: true,
  }),
  multi_branch: preset('Recall cao (Multi-Branch)', 'Bắt nhiều bbox nhất có thể. Chậm hơn, phù hợp ảnh khó.', {
    resize_scale: 2.0,
    contrast_method: 'clahe',
    denoise_method: 'nlm',
    threshold_method: 'adaptive',
    morphology_mode: 'open_close',
    gabor_enabled: true,
    mser_enabled: true,
    contours_enabled: true,
    multi_branch_enabled: true,
    merge_close_boxes: true,
    min_area: 15,
  }),
};

const LOADING_STEPS = [
  'Giải mã ảnh (decode)',
  'Chuyển xám (grayscale)',
  'Tương phản / ánh sáng nền',
  'Khử nhiễu (denoise)',
  'Tăng nét / biên nét',
  'Ngưỡng hóa đa nhánh',
  'Hình thái học (morphology)',
  'Xóa đường kẻ bảng',
  'Đề xuất vùng (region proposals)',
  'Lọc / gộp bbox',
  'Crop và xuất kết quả',
];

const ImageProcess = () => {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [parameters, setParameters] = useState(PRESETS.auto_optimal.parameters);
  const [presetId, setPresetId] = useState('auto_optimal');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null);

  const stats = resultData?.statistics;
  const canRun = Boolean(imageFile) && !loading;

  const badges = useMemo(() => [
    'Chế độ: Advanced Classical CV',
    'Nhận dạng: Tắt',
    'Model: Chưa train',
    'Dataset: Chưa cần',
    'Output: Candidate boxes',
  ], []);

  const handleImageSelect = (file) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultData(null);
    setError('');
  };

  const selectPreset = (id) => {
    setPresetId(id);
    setParameters(PRESETS[id].parameters);
  };

  const handleRun = async () => {
    if (!imageFile) {
      setError('Hãy chọn ảnh trước khi chạy.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await uploadAndProcessImage(imageFile, parameters);
      setResultData(result);
      saveHistorySummary(result);
    } catch (err) {
      setError(err.message || 'Backend xử lý thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(null);
    setPreviewUrl('');
    setResultData(null);
    setError('');
  };

  return (
    <div className="flex flex-col gap-6 anim-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="page-eyebrow">Workspace</h2>
          <h1 className="page-title">OpenCV Advanced BBox Pipeline</h1>
          <p className="page-sub">Tiền xử lý ảnh cổ điển (Classical CV) và trích bbox ứng viên (candidate bounding boxes). Không nhận dạng ký tự.</p>
        </div>
        <div className="flex flex-wrap gap-2 max-w-xl">
          {badges.map((badge) => <span key={badge} className="badge badge-blue">{badge}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 flex flex-col gap-5">
          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="card-title">Input image</h3>
                <p className="card-sub">Ảnh JPG/PNG, tối đa 10MB.</p>
              </div>
              {imageFile && <button onClick={reset} className="btn btn-sm btn-ghost">Xóa</button>}
            </div>
            <DragDropZone onImageSelect={handleImageSelect} />
            {previewUrl && (
              <div className="mt-4 rounded-xl overflow-hidden" style={{ background: '#040d1a', border: '1px solid rgba(56,189,248,0.12)' }}>
                <img src={previewUrl} alt="Selected preview" className="w-full max-h-56 object-contain p-2" />
              </div>
            )}
            {imageFile && (
              <p className="text-xs text-slate-400 mt-2 truncate">
                {imageFile.name} - {(imageFile.size / 1024).toFixed(1)} KB - {imageFile.type}
              </p>
            )}
            {error && <p className="text-red-400 text-sm mt-3 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="mb-3">
              <h3 className="card-title">Preset nhanh</h3>
              <p className="card-sub">Chọn theo tình trạng ảnh. Có thể chỉnh sâu bằng Settings sau đó.</p>
            </div>
            <div className="preset-grid">
              {Object.entries(PRESETS).map(([id, item]) => (
                <button key={id} onClick={() => selectPreset(id)} className={`preset-card ${presetId === id ? 'active' : ''}`}>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="card-title">Cấu hình chạy</h3>
                <p className="card-sub">Bấm icon sliders để chỉnh tham số.</p>
              </div>
              <button type="button" className="settings-icon-btn" onClick={() => setSettingsOpen(true)} title="Cài đặt pipeline" aria-label="Cài đặt pipeline">
                <SlidersIcon />
              </button>
            </div>
            <ParameterSummary parameters={parameters} />
            <button onClick={handleRun} disabled={!canRun} className={`btn w-full mt-4 ${!canRun ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}>
              Chạy pipeline BBox
            </button>
          </div>
        </div>

        <div className="xl:col-span-8 flex flex-col gap-5">
          {loading && (
            <div className="card card-glow" style={{ minHeight: 260 }}>
              <h3 className="text-teal font-bold text-lg mb-4">Đang chạy Advanced BBox Pipeline</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LOADING_STEPS.map((step, index) => (
                  <div key={step} className="rounded-xl px-3 py-2 text-sm" style={{ background: 'rgba(7,21,38,0.55)', border: '1px solid rgba(56,189,248,0.08)', color: '#cbd5e1' }}>
                    {String(index + 1).padStart(2, '0')} - {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && !resultData && (
            <div className="card flex flex-col items-center justify-center text-center opacity-80" style={{ minHeight: 320, padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 16, color: '#2dd4bf', fontWeight: 900 }}>BBox</div>
              <h3 style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Chưa có lượt chạy</h3>
              <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460 }}>
                Chọn ảnh, chọn preset hoặc chỉnh settings, rồi chạy pipeline. Kết quả chỉ là bbox ứng viên.
              </p>
              <div className="empty-steps">
                {LOADING_STEPS.slice(0, 6).map((step, index) => <span key={step}>{index + 1}. {step}</span>)}
              </div>
            </div>
          )}

          {resultData && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Stat label="BBox ứng viên" value={stats?.candidate_boxes ?? 0} />
                <Stat label="BBox có thể dính" value={stats?.possible_connected_characters ?? 0} />
                <Stat label="Nhiễu đã lọc" value={stats?.removed_noise_components ?? 0} />
                <Stat label="Thời gian xử lý" value={`${resultData.processing_time_ms}ms`} />
              </div>

              <div className="card card-glow" style={{ padding: 20 }}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-teal font-bold text-lg">Result {resultData.result_id}</h3>
                    <p className="text-xs text-slate-500 mt-1">{resultData.filename}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={resultData.output_image_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Mở output.png</a>
                    <a href={resultData.output_txt_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Mở output.txt</a>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#040d1a', border: '1px solid rgba(45,212,191,0.18)', minHeight: 240 }}>
                  <img src={resultData.output_image_url} alt="Candidate boxes output" className="w-full max-h-[420px] object-contain p-2" />
                </div>
              </div>

              <PipelineFeedback
                comment={resultData.system_comment}
                statistics={resultData.statistics}
                mode={resultData.mode || 'opencv_advanced_bbox'}
                recognitionEnabled={resultData.recognition_enabled}
                modelTrained={resultData.model_trained}
              />
              <ImageTabs pipelineImages={resultData.pipeline_images} />
              <BoundingBoxTable boxes={resultData.boxes || []} />
            </>
          )}
        </div>
      </div>

      {settingsOpen && (
        <ParameterPanel
          parameters={parameters}
          onSave={(next) => {
            setParameters(next);
            setSettingsOpen(false);
          }}
          onCancel={() => setSettingsOpen(false)}
          disabled={loading}
          presetName={PRESETS[presetId].label}
        />
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-xl p-4" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.12)' }}>
    <p className="text-[11px] uppercase font-bold tracking-widest" style={{ color: '#64748b' }}>{label}</p>
    <p className="text-2xl font-black mt-1" style={{ color: '#2dd4bf' }}>{value}</p>
  </div>
);

const saveHistorySummary = (result) => {
  const summary = {
    result_id: result.result_id,
    filename: result.filename,
    created_at: result.created_at,
    candidate_boxes: result.statistics?.candidate_boxes ?? result.boxes?.length ?? 0,
    possible_connected_characters: result.statistics?.possible_connected_characters ?? 0,
    removed_noise_components: result.statistics?.removed_noise_components ?? 0,
    processing_time_ms: result.processing_time_ms,
    output_image_url: result.output_image_url,
    output_txt_url: result.output_txt_url,
    mode: result.mode,
  };

  const existing = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
  const next = [summary, ...existing.filter((item) => item.result_id !== summary.result_id)].slice(0, 50);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
};

const ParameterSummary = ({ parameters }) => {
  const rows = [
    ['Ngưỡng', parameters.threshold_method],
    ['Khử nhiễu', parameters.denoise_method],
    ['Morphology', parameters.morphology_mode],
    ['BBox', parameters.multi_branch_enabled ? 'multi-branch' : 'single-branch'],
    ['Line removal', parameters.remove_lines ? 'on' : 'off'],
    ['Min area', parameters.min_area],
  ];

  return (
    <div className="param-summary">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{String(value)}</strong>
        </div>
      ))}
    </div>
  );
};

const SlidersIcon = () => (
  <span className="sliders-icon" aria-hidden="true">
    <i />
    <i />
    <i />
  </span>
);

export default ImageProcess;
