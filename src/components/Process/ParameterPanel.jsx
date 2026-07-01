import React, { useMemo, useState } from 'react';

const oddKernels = [1, 3, 5, 7, 9];
const blockSizes = [3, 5, 7, 11, 15, 21, 25, 31, 41, 51];

const sections = [
  ['size', 'Ảnh', 'Size / contrast'],
  ['denoise', 'Khử nhiễu', 'Denoise'],
  ['edge', 'Nét', 'Sharpen / edge'],
  ['threshold', 'Ngưỡng', 'Threshold'],
  ['morphology', 'Hình thái', 'Morphology'],
  ['lines', 'Đường kẻ', 'Line removal'],
  ['bbox', 'BBox', 'Extraction'],
  ['fusion', 'Gộp', 'Merge / fusion'],
];

const ParameterPanel = ({ parameters, onSave, onCancel, disabled, presetName }) => {
  const [draft, setDraft] = useState(parameters);
  const [active, setActive] = useState('size');
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updatePair = (key, index, value) => {
    const next = [...(draft[key] || [1, 1])];
    next[index] = Number(value);
    update(key, next);
  };
  const toggleMethod = (method, enabled) => {
    const set = new Set(draft.bbox_methods || []);
    if (enabled) set.add(method);
    else set.delete(method);
    return [...set];
  };

  const activeTitle = useMemo(() => sections.find(([id]) => id === active), [active]);

  return (
    <div className="settings-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="settings-dialog" role="dialog" aria-modal="true" aria-label="Cài đặt pipeline" onMouseDown={(event) => event.stopPropagation()}>
        <div className="settings-head">
          <div>
            <h3>Cài đặt pipeline (Settings)</h3>
            <p>Preset: {presetName}. Chỉ tạo bbox ứng viên (candidate boxes).</p>
          </div>
          <button type="button" className="settings-close" onClick={onCancel} aria-label="Đóng cài đặt">×</button>
        </div>

        <div className="settings-body">
          <nav className="settings-tabs" aria-label="Nhóm cài đặt">
            {sections.map(([id, label, hint]) => (
              <button key={id} type="button" className={active === id ? 'active' : ''} onClick={() => setActive(id)}>
                <span>{label}</span>
                <small>{hint}</small>
              </button>
            ))}
          </nav>

          <section className="settings-content">
            <div className="settings-section-title">
              <span>{activeTitle?.[1]}</span>
              <small>{activeTitle?.[2]}</small>
            </div>
            {active === 'size' && (
              <FieldGrid>
                <NumberField label="Tỉ lệ phóng (resize)" value={draft.resize_scale} step="0.25" min="0.25" onChange={(v) => update('resize_scale', v)} />
                <NumberField label="Rộng tối đa (max width)" value={draft.max_width} min="1" onChange={(v) => update('max_width', v)} />
                <SelectField label="Tương phản (contrast)" value={draft.contrast_method} onChange={(v) => update('contrast_method', v)} options={['none', 'hist_equalization', 'clahe']} />
                <NumberField label="CLAHE clip" value={draft.clahe_clip_limit} step="0.1" min="0.1" onChange={(v) => update('clahe_clip_limit', v)} />
                <PairField label="Ô CLAHE (tile grid)" values={draft.clahe_tile_grid_size} onChange={(i, v) => updatePair('clahe_tile_grid_size', i, v)} />
                <SelectField label="Ánh sáng nền (illumination)" value={draft.illumination_correction} onChange={(v) => update('illumination_correction', v)} options={['none', 'background_division', 'background_subtraction']} />
                <SelectField label="Kernel nền" value={draft.illumination_kernel_size} onChange={(v) => update('illumination_kernel_size', Number(v))} options={blockSizes} />
              </FieldGrid>
            )}

            {active === 'denoise' && (
              <FieldGrid>
                <SelectField label="Cách khử nhiễu (denoise)" value={draft.denoise_method} onChange={(v) => update('denoise_method', v)} options={['none', 'median', 'gaussian', 'bilateral', 'nlm']} />
                <SelectField label="Median kernel" value={draft.median_kernel} onChange={(v) => update('median_kernel', Number(v))} options={oddKernels} />
                <SelectField label="Gaussian kernel" value={draft.gaussian_kernel} onChange={(v) => update('gaussian_kernel', Number(v))} options={oddKernels} />
                <NumberField label="Bilateral d" value={draft.bilateral_d} min="1" onChange={(v) => update('bilateral_d', v)} />
                <NumberField label="Sigma màu" value={draft.bilateral_sigma_color} min="1" onChange={(v) => update('bilateral_sigma_color', v)} />
                <NumberField label="Sigma không gian" value={draft.bilateral_sigma_space} min="1" onChange={(v) => update('bilateral_sigma_space', v)} />
                <NumberField label="NLM h" value={draft.nlm_h} min="0" onChange={(v) => update('nlm_h', v)} />
              </FieldGrid>
            )}

            {active === 'edge' && (
              <FieldGrid>
                <SelectField label="Làm sắc nét (sharpen)" value={draft.sharpen_method} onChange={(v) => update('sharpen_method', v)} options={['none', 'unsharp', 'laplacian_boost']} />
                <NumberField label="Unsharp amount" value={draft.unsharp_amount} step="0.1" min="0" onChange={(v) => update('unsharp_amount', v)} />
                <SelectField label="Biên nét (edge)" value={draft.edge_method} onChange={(v) => update('edge_method', v)} options={['none', 'sobel', 'scharr', 'laplacian', 'log', 'dog', 'canny']} />
                <NumberField label="DoG sigma nhỏ" value={draft.dog_sigma_small} step="0.1" min="0.1" onChange={(v) => update('dog_sigma_small', v)} />
                <NumberField label="DoG sigma lớn" value={draft.dog_sigma_large} step="0.1" min="0.1" onChange={(v) => update('dog_sigma_large', v)} />
                <NumberField label="LoG sigma" value={draft.log_sigma} step="0.1" min="0.1" onChange={(v) => update('log_sigma', v)} />
                <CheckboxField label="Bật Gabor branch" checked={draft.gabor_enabled} onChange={(v) => update('gabor_enabled', v)} />
              </FieldGrid>
            )}

            {active === 'threshold' && (
              <FieldGrid>
                <SelectField label="Cách ngưỡng hóa (threshold)" value={draft.threshold_method} onChange={(v) => update('threshold_method', v)} options={['otsu', 'manual', 'adaptive', 'sauvola', 'niblack']} />
                <NumberField label="Ngưỡng tay (manual)" value={draft.manual_threshold} min="0" max="255" onChange={(v) => update('manual_threshold', v)} />
                <SelectField label="Adaptive method" value={draft.adaptive_method} onChange={(v) => update('adaptive_method', v)} options={['mean', 'gaussian']} />
                <SelectField label="Adaptive block" value={draft.adaptive_block_size} onChange={(v) => update('adaptive_block_size', Number(v))} options={blockSizes} />
                <NumberField label="Adaptive C" value={draft.adaptive_c} onChange={(v) => update('adaptive_c', v)} />
                <SelectField label="Sauvola window" value={draft.sauvola_window_size} onChange={(v) => update('sauvola_window_size', Number(v))} options={blockSizes} />
                <NumberField label="Sauvola k" value={draft.sauvola_k} step="0.05" onChange={(v) => update('sauvola_k', v)} />
                <SelectField label="Niblack window" value={draft.niblack_window_size} onChange={(v) => update('niblack_window_size', Number(v))} options={blockSizes} />
                <NumberField label="Niblack k" value={draft.niblack_k} step="0.05" onChange={(v) => update('niblack_k', v)} />
                <CheckboxField label="Đảo nền/nét (invert)" checked={draft.invert} onChange={(v) => update('invert', v)} />
              </FieldGrid>
            )}

            {active === 'morphology' && (
              <FieldGrid>
                <SelectField label="Hình thái (morphology)" value={draft.morphology_mode} onChange={(v) => update('morphology_mode', v)} options={['none', 'opening', 'closing', 'open_close', 'close_open', 'dilation', 'erosion']} />
                <SelectField label="Dạng kernel" value={draft.kernel_shape} onChange={(v) => update('kernel_shape', v)} options={['rect', 'ellipse', 'cross']} />
                <PairField label="Kích thước kernel" values={draft.kernel_size} onChange={(i, v) => updatePair('kernel_size', i, v)} />
                <NumberField label="Opening lần" value={draft.opening_iterations} min="0" onChange={(v) => update('opening_iterations', v)} />
                <NumberField label="Closing lần" value={draft.closing_iterations} min="0" onChange={(v) => update('closing_iterations', v)} />
                <NumberField label="Dilation lần" value={draft.dilation_iterations} min="0" onChange={(v) => update('dilation_iterations', v)} />
                <NumberField label="Erosion lần" value={draft.erosion_iterations} min="0" onChange={(v) => update('erosion_iterations', v)} />
              </FieldGrid>
            )}

            {active === 'lines' && (
              <FieldGrid>
                <CheckboxField label="Xóa đường bảng (line removal)" checked={draft.remove_lines} onChange={(v) => update('remove_lines', v)} />
                <SelectField label="Cách xóa đường" value={draft.line_removal_method} onChange={(v) => update('line_removal_method', v)} options={['morphology', 'hough', 'morphology_hough']} />
                <NumberField label="Kernel ngang" value={draft.horizontal_line_kernel} min="1" onChange={(v) => update('horizontal_line_kernel', v)} />
                <NumberField label="Kernel dọc" value={draft.vertical_line_kernel} min="1" onChange={(v) => update('vertical_line_kernel', v)} />
                <NumberField label="Hough threshold" value={draft.hough_threshold} min="0" onChange={(v) => update('hough_threshold', v)} />
                <NumberField label="Min line length" value={draft.hough_min_line_length} min="0" onChange={(v) => update('hough_min_line_length', v)} />
                <NumberField label="Max line gap" value={draft.hough_max_line_gap} min="0" onChange={(v) => update('hough_max_line_gap', v)} />
              </FieldGrid>
            )}

            {active === 'bbox' && (
              <FieldGrid>
                <CheckboxField label="Connected components" checked={(draft.bbox_methods || []).includes('connected_components')} onChange={(v) => update('bbox_methods', toggleMethod('connected_components', v))} />
                <CheckboxField label="Contours" checked={draft.contours_enabled} onChange={(v) => setDraft({ ...draft, contours_enabled: v, bbox_methods: toggleMethod('contours', v) })} />
                <CheckboxField label="MSER" checked={draft.mser_enabled} onChange={(v) => setDraft({ ...draft, mser_enabled: v, bbox_methods: toggleMethod('mser', v) })} />
                <SelectField label="Liên thông (connectivity)" value={draft.connectivity} onChange={(v) => update('connectivity', Number(v))} options={[4, 8]} />
                <NumberField label="Diện tích min" value={draft.min_area} min="0" onChange={(v) => update('min_area', v)} />
                <NumberField label="Diện tích max" value={draft.max_area ?? ''} min="0" onChange={(v) => update('max_area', v === '' ? null : v)} />
                <NumberField label="Rộng min" value={draft.min_width} min="0" onChange={(v) => update('min_width', v)} />
                <NumberField label="Cao min" value={draft.min_height} min="0" onChange={(v) => update('min_height', v)} />
                <NumberField label="Aspect min" value={draft.min_aspect_ratio} step="0.01" min="0.01" onChange={(v) => update('min_aspect_ratio', v)} />
                <NumberField label="Aspect max" value={draft.max_aspect_ratio} step="0.1" min="0.1" onChange={(v) => update('max_aspect_ratio', v)} />
                <NumberField label="Fill ratio min" value={draft.min_fill_ratio} step="0.01" min="0" onChange={(v) => update('min_fill_ratio', v)} />
                <NumberField label="Đệm crop (padding)" value={draft.padding} min="0" onChange={(v) => update('padding', v)} />
              </FieldGrid>
            )}

            {active === 'fusion' && (
              <FieldGrid>
                <CheckboxField label="Gộp bbox gần nhau" checked={draft.merge_close_boxes} onChange={(v) => update('merge_close_boxes', v)} />
                <NumberField label="Khoảng X gộp" value={draft.merge_x_gap} min="0" onChange={(v) => update('merge_x_gap', v)} />
                <NumberField label="Y overlap ratio" value={draft.merge_y_overlap_ratio} step="0.05" min="0" onChange={(v) => update('merge_y_overlap_ratio', v)} />
                <CheckboxField label="Tách bbox rộng" checked={draft.split_wide_boxes} onChange={(v) => update('split_wide_boxes', v)} />
                <CheckboxField label="Đa nhánh (multi-branch)" checked={draft.multi_branch_enabled} onChange={(v) => update('multi_branch_enabled', v)} />
                <NumberField label="Fusion IoU" value={draft.box_fusion_iou_threshold} step="0.05" min="0" onChange={(v) => update('box_fusion_iou_threshold', v)} />
                <NumberField label="NMS IoU" value={draft.nms_iou_threshold} step="0.05" min="0" onChange={(v) => update('nms_iou_threshold', v)} />
              </FieldGrid>
            )}
          </section>
        </div>

        <div className="settings-footer">
          <p>Thay đổi chỉ áp dụng sau khi bấm Lưu cài đặt (Save).</p>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="btn btn-sm btn-ghost">Hủy</button>
            <button type="button" onClick={() => onSave(draft)} disabled={disabled} className="btn btn-sm btn-primary">Lưu cài đặt</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FieldGrid = ({ children }) => (
  <div className="settings-grid">{children}</div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <Field label={label}>
    <select className="form-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </Field>
);

const NumberField = ({ label, value, onChange, ...props }) => (
  <Field label={label}>
    <input className="form-input" type="number" value={value} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} {...props} />
  </Field>
);

const PairField = ({ label, values = [1, 1], onChange }) => (
  <Field label={label}>
    <div className="grid grid-cols-2 gap-2">
      <input className="form-input" type="number" min="1" value={values[0]} onChange={(e) => onChange(0, e.target.value)} />
      <input className="form-input" type="number" min="1" value={values[1]} onChange={(e) => onChange(1, e.target.value)} />
    </div>
  </Field>
);

const CheckboxField = ({ label, checked, onChange = () => {} }) => (
  <label className="settings-check">
    <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} className="accent-teal-500" />
    <span>{label}</span>
  </label>
);

export default ParameterPanel;
