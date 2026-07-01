import React, { useMemo, useState } from 'react';
import ParameterPanel from '../components/Process/ParameterPanel';
import BoundingBoxTable from '../components/Result/BoundingBoxTable';
import ImageTabs from '../components/Result/ImageTabs';
import LLMFeedback from '../components/Result/LLMFeedback';
import DragDropZone from '../components/Upload/DragDropZone';
import { uploadAndProcessImage } from '../services/api';

export const HISTORY_STORAGE_KEY = 'noisy_digits_history';

const DEFAULT_PARAMETERS = {
  threshold_mode: 'otsu',
  manual_threshold: 128,
  adaptive_block_size: 31,
  adaptive_c: 11,
  blur_type: 'median',
  blur_kernel: 3,
  kernel_size: [2, 2],
  morphology_mode: 'open_close',
  dilation_iterations: 0,
  erosion_iterations: 0,
  min_area: 50,
  max_area: null,
  min_width: 2,
  min_height: 5,
  padding: 2,
  connectivity: 8,
  invert: true,
};

const PRESETS = {
  clean_document: {
    label: 'Clean document',
    parameters: { ...DEFAULT_PARAMETERS, blur_type: 'none', min_area: 30, morphology_mode: 'opening', padding: 1 },
  },
  light_noise: {
    label: 'Light noise',
    parameters: { ...DEFAULT_PARAMETERS, blur_type: 'median', blur_kernel: 3, min_area: 50, morphology_mode: 'open_close' },
  },
  heavy_noise: {
    label: 'Heavy noise',
    parameters: { ...DEFAULT_PARAMETERS, blur_type: 'median', blur_kernel: 5, min_area: 80, morphology_mode: 'open_close', dilation_iterations: 1 },
  },
  thin_text: {
    label: 'Thin text',
    parameters: { ...DEFAULT_PARAMETERS, min_area: 20, min_width: 1, min_height: 3, morphology_mode: 'closing', dilation_iterations: 1 },
  },
  bold_text: {
    label: 'Bold text',
    parameters: { ...DEFAULT_PARAMETERS, min_area: 100, kernel_size: [3, 3], morphology_mode: 'opening', erosion_iterations: 1 },
  },
};

const ImageProcess = () => {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [parameters, setParameters] = useState(DEFAULT_PARAMETERS);
  const [preset, setPreset] = useState('light_noise');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultData, setResultData] = useState(null);

  const stats = resultData?.statistics;
  const datasetLabel = 'Dataset Not Downloaded';
  const canRun = Boolean(imageFile) && !loading;

  const badges = useMemo(() => [
    'Mode: OpenCV Base',
    'Recognizer: Mock deterministic',
    datasetLabel,
    'No Trained Model Yet',
  ], []);

  const handleImageSelect = (file) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultData(null);
    setError('');
  };

  const selectPreset = (id) => {
    setPreset(id);
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
          <h1 className="page-title">OpenCV Character Pipeline</h1>
          <p className="page-sub">Upload an image, tune traditional CV parameters, and inspect real backend artifacts.</p>
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
            {imageFile && <p className="text-xs text-slate-400 mt-2 truncate">{imageFile.name}</p>}
            {error && (
              <p className="text-red-400 text-sm mt-3 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 className="card-title mb-3">Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRESETS).map(([id, item]) => (
                <button
                  key={id}
                  onClick={() => selectPreset(id)}
                  className={`btn btn-sm ${preset === id ? 'btn-primary' : 'btn-secondary'}`}
                >
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
          />
        </div>

        <div className="xl:col-span-8 flex flex-col gap-5">
          {loading && (
            <div className="card card-glow flex flex-col items-center justify-center text-center" style={{ minHeight: 260 }}>
              <div className="spin text-3xl mb-4">...</div>
              <h3 className="text-teal font-bold text-lg">Running OpenCV Base Pipeline</h3>
              <p className="text-sm text-slate-400 mt-2">Backend is generating grayscale, denoised, binary, morphology, components, crops, output image, and output.txt.</p>
            </div>
          )}

          {!loading && !resultData && (
            <div className="card flex flex-col items-center justify-center text-center opacity-80" style={{ minHeight: 320, padding: 32 }}>
              <div style={{ fontSize: 44, marginBottom: 16 }}>ND</div>
              <h3 style={{ color: '#cbd5e1', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No run yet</h3>
              <p style={{ color: '#64748b', fontSize: 14, maxWidth: 420 }}>
                Select an image and run the backend OpenCV pipeline. No trained model or dataset is used in this phase.
              </p>
            </div>
          )}

          {resultData && !loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Stat label="Detected boxes" value={stats?.detected_boxes ?? 0} />
                <Stat label="Low confidence" value={stats?.low_confidence_count ?? 0} />
                <Stat label="Noise removed" value={stats?.noise_component_count ?? 0} />
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
                  <img src={resultData.output_image_url} alt="Output with boxes" className="w-full max-h-[420px] object-contain p-2" />
                </div>
              </div>

              <LLMFeedback
                comment={resultData.llm_comment}
                modelVersion={resultData.model_version}
                mode="OpenCV Base Pipeline"
                datasetStatus={datasetLabel}
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
    detected_boxes: result.statistics?.detected_boxes ?? 0,
    average_confidence: result.statistics?.average_confidence ?? 0,
    low_confidence_count: result.statistics?.low_confidence_count ?? 0,
    processing_time_ms: result.processing_time_ms,
    output_image_url: result.output_image_url,
    output_txt_url: result.output_txt_url,
    model_version: result.model_version,
  };

  const existing = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
  const next = [summary, ...existing.filter((item) => item.result_id !== summary.result_id)].slice(0, 50);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
};

export default ImageProcess;
