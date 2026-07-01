import React from 'react';

const oddKernels = [1, 3, 5, 7, 9];
const blockSizes = [3, 5, 7, 11, 15, 21, 25, 31, 41, 51];

const ParameterPanel = ({ parameters, onChange, onRun, disabled, presetName }) => {
  const update = (key, value) => onChange({ ...parameters, [key]: value });
  const updatePair = (key, index, value) => {
    const next = [...parameters[key]];
    next[index] = Number(value);
    update(key, next);
  };
  const toggleMethod = (method, enabled) => {
    const set = new Set(parameters.bbox_methods || []);
    if (enabled) set.add(method);
    else set.delete(method);
    return [...set];
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="card-title">Advanced BBox Parameters</h3>
          <p className="card-sub">Preset: {presetName}. BBox only, no recognition.</p>
        </div>
        <span className="badge badge-blue">Classical CV</span>
      </div>

      <Section title="Size / Contrast">
        <NumberField label="Resize scale" value={parameters.resize_scale} step="0.25" min="0.25" onChange={(v) => update('resize_scale', v)} />
        <NumberField label="Max width" value={parameters.max_width} min="1" onChange={(v) => update('max_width', v)} />
        <SelectField label="Contrast" value={parameters.contrast_method} onChange={(v) => update('contrast_method', v)} options={['none', 'hist_equalization', 'clahe']} />
        <NumberField label="CLAHE clip" value={parameters.clahe_clip_limit} step="0.1" min="0.1" onChange={(v) => update('clahe_clip_limit', v)} />
        <PairField label="CLAHE tile grid" values={parameters.clahe_tile_grid_size} onChange={(i, v) => updatePair('clahe_tile_grid_size', i, v)} />
      </Section>

      <Section title="Illumination">
        <SelectField label="Correction" value={parameters.illumination_correction} onChange={(v) => update('illumination_correction', v)} options={['none', 'background_division', 'background_subtraction']} />
        <SelectField label="Kernel size" value={parameters.illumination_kernel_size} onChange={(v) => update('illumination_kernel_size', Number(v))} options={blockSizes} />
      </Section>

      <Section title="Denoising">
        <SelectField label="Method" value={parameters.denoise_method} onChange={(v) => update('denoise_method', v)} options={['none', 'median', 'gaussian', 'bilateral', 'nlm']} />
        <SelectField label="Median kernel" value={parameters.median_kernel} onChange={(v) => update('median_kernel', Number(v))} options={oddKernels} />
        <SelectField label="Gaussian kernel" value={parameters.gaussian_kernel} onChange={(v) => update('gaussian_kernel', Number(v))} options={oddKernels} />
        <NumberField label="Bilateral d" value={parameters.bilateral_d} min="1" onChange={(v) => update('bilateral_d', v)} />
        <NumberField label="NLM h" value={parameters.nlm_h} min="0" onChange={(v) => update('nlm_h', v)} />
      </Section>

      <Section title="Sharpen / Edge">
        <SelectField label="Sharpen" value={parameters.sharpen_method} onChange={(v) => update('sharpen_method', v)} options={['none', 'unsharp', 'laplacian_boost']} />
        <NumberField label="Unsharp amount" value={parameters.unsharp_amount} step="0.1" min="0" onChange={(v) => update('unsharp_amount', v)} />
        <SelectField label="Edge method" value={parameters.edge_method} onChange={(v) => update('edge_method', v)} options={['none', 'sobel', 'scharr', 'laplacian', 'log', 'dog', 'canny']} />
        <NumberField label="DoG sigma small" value={parameters.dog_sigma_small} step="0.1" min="0.1" onChange={(v) => update('dog_sigma_small', v)} />
        <NumberField label="DoG sigma large" value={parameters.dog_sigma_large} step="0.1" min="0.1" onChange={(v) => update('dog_sigma_large', v)} />
        <NumberField label="LoG sigma" value={parameters.log_sigma} step="0.1" min="0.1" onChange={(v) => update('log_sigma', v)} />
      </Section>

      <Section title="Gabor">
        <CheckboxField label="Gabor branch" checked={parameters.gabor_enabled} onChange={(v) => update('gabor_enabled', v)} />
        <CheckboxField label="Use default frequencies / angles" checked readOnly />
      </Section>

      <Section title="Threshold">
        <SelectField label="Method" value={parameters.threshold_method} onChange={(v) => update('threshold_method', v)} options={['otsu', 'manual', 'adaptive', 'sauvola', 'niblack']} />
        <NumberField label="Manual threshold" value={parameters.manual_threshold} min="0" max="255" onChange={(v) => update('manual_threshold', v)} />
        <SelectField label="Adaptive method" value={parameters.adaptive_method} onChange={(v) => update('adaptive_method', v)} options={['mean', 'gaussian']} />
        <SelectField label="Adaptive block" value={parameters.adaptive_block_size} onChange={(v) => update('adaptive_block_size', Number(v))} options={blockSizes} />
        <NumberField label="Adaptive C" value={parameters.adaptive_c} onChange={(v) => update('adaptive_c', v)} />
        <SelectField label="Sauvola window" value={parameters.sauvola_window_size} onChange={(v) => update('sauvola_window_size', Number(v))} options={blockSizes} />
        <NumberField label="Sauvola k" value={parameters.sauvola_k} step="0.05" onChange={(v) => update('sauvola_k', v)} />
        <SelectField label="Niblack window" value={parameters.niblack_window_size} onChange={(v) => update('niblack_window_size', Number(v))} options={blockSizes} />
        <NumberField label="Niblack k" value={parameters.niblack_k} step="0.05" onChange={(v) => update('niblack_k', v)} />
        <CheckboxField label="Invert foreground to white" checked={parameters.invert} onChange={(v) => update('invert', v)} />
      </Section>

      <Section title="Morphology">
        <SelectField label="Mode" value={parameters.morphology_mode} onChange={(v) => update('morphology_mode', v)} options={['none', 'opening', 'closing', 'open_close', 'close_open', 'dilation', 'erosion']} />
        <SelectField label="Kernel shape" value={parameters.kernel_shape} onChange={(v) => update('kernel_shape', v)} options={['rect', 'ellipse', 'cross']} />
        <PairField label="Kernel size" values={parameters.kernel_size} onChange={(i, v) => updatePair('kernel_size', i, v)} />
        <NumberField label="Opening iters" value={parameters.opening_iterations} min="0" onChange={(v) => update('opening_iterations', v)} />
        <NumberField label="Closing iters" value={parameters.closing_iterations} min="0" onChange={(v) => update('closing_iterations', v)} />
        <NumberField label="Dilation iters" value={parameters.dilation_iterations} min="0" onChange={(v) => update('dilation_iterations', v)} />
        <NumberField label="Erosion iters" value={parameters.erosion_iterations} min="0" onChange={(v) => update('erosion_iterations', v)} />
      </Section>

      <Section title="Line Removal">
        <CheckboxField label="Remove table/grid lines" checked={parameters.remove_lines} onChange={(v) => update('remove_lines', v)} />
        <SelectField label="Method" value={parameters.line_removal_method} onChange={(v) => update('line_removal_method', v)} options={['morphology', 'hough', 'morphology_hough']} />
        <NumberField label="Horizontal kernel" value={parameters.horizontal_line_kernel} min="1" onChange={(v) => update('horizontal_line_kernel', v)} />
        <NumberField label="Vertical kernel" value={parameters.vertical_line_kernel} min="1" onChange={(v) => update('vertical_line_kernel', v)} />
      </Section>

      <Section title="BBox Extraction">
        <CheckboxField label="Connected components" checked={(parameters.bbox_methods || []).includes('connected_components')} onChange={(v) => update('bbox_methods', toggleMethod('connected_components', v))} />
        <CheckboxField label="Contours" checked={parameters.contours_enabled} onChange={(v) => onChange({ ...parameters, contours_enabled: v, bbox_methods: toggleMethod('contours', v) })} />
        <CheckboxField label="MSER" checked={parameters.mser_enabled} onChange={(v) => onChange({ ...parameters, mser_enabled: v, bbox_methods: toggleMethod('mser', v) })} />
        <SelectField label="Connectivity" value={parameters.connectivity} onChange={(v) => update('connectivity', Number(v))} options={[4, 8]} />
        <NumberField label="Min area" value={parameters.min_area} min="0" onChange={(v) => update('min_area', v)} />
        <NumberField label="Max area" value={parameters.max_area ?? ''} min="0" onChange={(v) => update('max_area', v === '' ? null : v)} />
        <NumberField label="Min width" value={parameters.min_width} min="0" onChange={(v) => update('min_width', v)} />
        <NumberField label="Min height" value={parameters.min_height} min="0" onChange={(v) => update('min_height', v)} />
        <NumberField label="Min aspect" value={parameters.min_aspect_ratio} step="0.01" min="0.01" onChange={(v) => update('min_aspect_ratio', v)} />
        <NumberField label="Max aspect" value={parameters.max_aspect_ratio} step="0.1" min="0.1" onChange={(v) => update('max_aspect_ratio', v)} />
        <NumberField label="Min fill ratio" value={parameters.min_fill_ratio} step="0.01" min="0" onChange={(v) => update('min_fill_ratio', v)} />
        <NumberField label="Padding" value={parameters.padding} min="0" onChange={(v) => update('padding', v)} />
      </Section>

      <Section title="Merge / Split / Fusion">
        <CheckboxField label="Merge close boxes" checked={parameters.merge_close_boxes} onChange={(v) => update('merge_close_boxes', v)} />
        <NumberField label="Merge x gap" value={parameters.merge_x_gap} min="0" onChange={(v) => update('merge_x_gap', v)} />
        <NumberField label="Y overlap ratio" value={parameters.merge_y_overlap_ratio} step="0.05" min="0" onChange={(v) => update('merge_y_overlap_ratio', v)} />
        <CheckboxField label="Split wide boxes" checked={parameters.split_wide_boxes} onChange={(v) => update('split_wide_boxes', v)} />
        <CheckboxField label="Multi-branch" checked={parameters.multi_branch_enabled} onChange={(v) => update('multi_branch_enabled', v)} />
        <NumberField label="NMS IoU" value={parameters.nms_iou_threshold} step="0.05" min="0" onChange={(v) => update('nms_iou_threshold', v)} />
      </Section>

      <button onClick={onRun} disabled={disabled} className={`btn w-full mt-5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}>
        Run Advanced BBox Pipeline
      </button>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="mb-5">
    <h4 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#2dd4bf' }}>{title}</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
  </div>
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

const PairField = ({ label, values, onChange }) => (
  <Field label={label}>
    <div className="grid grid-cols-2 gap-2">
      <input className="form-input" type="number" min="1" value={values[0]} onChange={(e) => onChange(0, e.target.value)} />
      <input className="form-input" type="number" min="1" value={values[1]} onChange={(e) => onChange(1, e.target.value)} />
    </div>
  </Field>
);

const CheckboxField = ({ label, checked, onChange = () => {}, readOnly = false }) => (
  <label className="flex items-center gap-2 text-sm text-slate-300">
    <input type="checkbox" checked={checked} readOnly={readOnly} onChange={(e) => onChange(e.target.checked)} className="accent-teal-500" />
    {label}
  </label>
);

export default ParameterPanel;
