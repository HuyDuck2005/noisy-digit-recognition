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

const preset = (label, patch) => ({ label, parameters: { ...DEFAULT_PARAMETERS, ...patch } });

const PRESETS = {
  clean_document: preset('Clean Document', {
    threshold_method: 'otsu',
    contrast_method: 'clahe',
    denoise_method: 'none',
    morphology_mode: 'opening',
    min_area: 20,
  }),
  light_noise: preset('Light Noise', {
    threshold_method: 'adaptive',
    denoise_method: 'median',
    median_kernel: 3,
    morphology_mode: 'opening',
    min_area: 30,
  }),
  heavy_noise: preset('Heavy Noise', {
    threshold_method: 'adaptive',
    denoise_method: 'nlm',
    nlm_h: 10,
    morphology_mode: 'open_close',
    opening_iterations: 1,
    closing_iterations: 1,
    min_area: 50,
  }),
  very_heavy_noise: preset('Very Heavy Noise', {
    resize_scale: 2.0,
    contrast_method: 'clahe',
    denoise_method: 'nlm',
    threshold_method: 'sauvola',
    morphology_mode: 'open_close',
    min_area: 60,
    multi_branch_enabled: true,
  }),
  table_lines: preset('Table Lines', {
    threshold_method: 'adaptive',
    denoise_method: 'median',
    morphology_mode: 'open_close',
    remove_lines: true,
    line_removal_method: 'morphology',
    horizontal_line_kernel: 30,
    vertical_line_kernel: 30,
  }),
  thin_text: preset('Thin Text', {
    threshold_method: 'adaptive',
    denoise_method: 'bilateral',
    morphology_mode: 'closing',
    dilation_iterations: 1,
    min_area: 10,
  }),
  bold_sticky_text: preset('Bold/Sticky Text', {
    threshold_method: 'adaptive',
    denoise_method: 'median',
    morphology_mode: 'opening',
    erosion_iterations: 1,
    split_wide_boxes: true,
  }),
  edge_gabor: preset('Edge/Gabor Experimental', {
    contrast_method: 'clahe',
    denoise_method: 'bilateral',
    edge_method: 'dog',
    gabor_enabled: true,
    threshold_method: 'adaptive',
    bbox_methods: ['connected_components', 'contours'],
    contours_enabled: true,
    multi_branch_enabled: true,
  }),
  multi_branch: preset('Multi-Branch Max Recall', {
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
  'Decode image',
  'Grayscale',
  'Contrast / illumination',
  'Denoise',
  'Edge/stroke enhancement',
  'Threshold branches',
  'Morphology',
  'Line removal',
  'Region proposals',
  'Box fusion/filtering',
  'Crops/output',
];

const ImageProcess = () => {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [parameters, setParameters] = useState(PRESETS.light_noise.parameters);
  const [presetId, setPresetId] = useState('light_noise');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null);

  const stats = resultData?.statistics;
  const canRun = Boolean(imageFile) && !loading;

  const badges = useMemo(() => [
    'Mode: Advanced Classical CV',
    'Recognition: Disabled',
    'Model: Not trained',
    'Dataset: Not required',
    'Output: Candidate boxes only',
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
      setError('Please select an image first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await uploadAndProcessImage(imageFile, parameters);
      setResultData(result);
      saveHistorySummary(result);
    } catch (err) {
      setError(err.message || 'Backend processing failed.');
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
          <p className="page-sub">Classical CV preprocessing and candidate bounding box extraction. No recognition model.</p>
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
                <p className="card-sub">JPG or PNG, max 10MB.</p>
              </div>
              {imageFile && <button onClick={reset} className="btn btn-sm btn-ghost">Clear</button>}
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
            <h3 className="card-title mb-3">Presets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(PRESETS).map(([id, item]) => (
                <button key={id} onClick={() => selectPreset(id)} className={`btn btn-sm ${presetId === id ? 'btn-primary' : 'btn-secondary'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <ParameterPanel
            parameters={parameters}
            onChange={setParameters}
            onRun={handleRun}
            disabled={!canRun}
            presetName={PRESETS[presetId].label}
          />
        </div>

        <div className="xl:col-span-8 flex flex-col gap-5">
          {loading && (
            <div className="card card-glow" style={{ minHeight: 260 }}>
              <h3 className="text-teal font-bold text-lg mb-4">Running Advanced BBox Pipeline</h3>
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
              <h3 style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No run yet</h3>
              <p style={{ color: '#64748b', fontSize: 14, maxWidth: 460 }}>
                Select an image and run advanced classical preprocessing. Output is candidate bounding boxes only.
              </p>
            </div>
          )}

          {resultData && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Stat label="Candidate boxes" value={stats?.candidate_boxes ?? 0} />
                <Stat label="Connected boxes" value={stats?.possible_connected_characters ?? 0} />
                <Stat label="Noise removed" value={stats?.removed_noise_components ?? 0} />
                <Stat label="Processing time" value={`${resultData.processing_time_ms}ms`} />
              </div>

              <div className="card card-glow" style={{ padding: 20 }}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-teal font-bold text-lg">Result {resultData.result_id}</h3>
                    <p className="text-xs text-slate-500 mt-1">{resultData.filename}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={resultData.output_image_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Open output.png</a>
                    <a href={resultData.output_txt_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Open output.txt</a>
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

export default ImageProcess;
