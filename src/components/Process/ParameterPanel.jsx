import React from 'react';

const blurKernels = [1, 3, 5, 7];
const blockSizes = [3, 5, 7, 11, 15, 21, 31, 41, 51];

const ParameterPanel = ({ parameters, onChange, onRun, disabled }) => {
  const update = (key, value) => onChange({ ...parameters, [key]: value });
  const updateKernel = (index, value) => {
    const next = [...parameters.kernel_size];
    next[index] = Number(value);
    update('kernel_size', next);
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="card-title">OpenCV Parameters</h3>
          <p className="card-sub">Traditional image-processing pipeline only.</p>
        </div>
        <span className="badge badge-blue">OpenCV Base</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Threshold mode">
          <select className="form-select" value={parameters.threshold_mode} onChange={(e) => update('threshold_mode', e.target.value)}>
            <option value="otsu">Otsu</option>
            <option value="manual">Manual</option>
            <option value="adaptive">Adaptive</option>
          </select>
        </Field>

        <Field label={`Manual threshold (${parameters.manual_threshold})`}>
          <input type="range" min="0" max="255" value={parameters.manual_threshold} onChange={(e) => update('manual_threshold', Number(e.target.value))} className="w-full accent-teal-500" />
        </Field>

        <Field label="Adaptive block size">
          <select className="form-select" value={parameters.adaptive_block_size} onChange={(e) => update('adaptive_block_size', Number(e.target.value))}>
            {blockSizes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>

        <Field label="Adaptive C">
          <input className="form-input" type="number" value={parameters.adaptive_c} onChange={(e) => update('adaptive_c', Number(e.target.value))} />
        </Field>

        <Field label="Blur type">
          <select className="form-select" value={parameters.blur_type} onChange={(e) => update('blur_type', e.target.value)}>
            <option value="none">None</option>
            <option value="median">Median</option>
            <option value="gaussian">Gaussian</option>
            <option value="bilateral">Bilateral</option>
          </select>
        </Field>

        <Field label="Blur kernel">
          <select className="form-select" value={parameters.blur_kernel} onChange={(e) => update('blur_kernel', Number(e.target.value))}>
            {blurKernels.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </Field>

        <Field label="Morphology mode">
          <select className="form-select" value={parameters.morphology_mode} onChange={(e) => update('morphology_mode', e.target.value)}>
            <option value="none">None</option>
            <option value="opening">Opening</option>
            <option value="closing">Closing</option>
            <option value="open_close">Open then close</option>
            <option value="close_open">Close then open</option>
          </select>
        </Field>

        <Field label="Kernel width / height">
          <div className="grid grid-cols-2 gap-2">
            <input className="form-input" type="number" min="1" value={parameters.kernel_size[0]} onChange={(e) => updateKernel(0, e.target.value)} />
            <input className="form-input" type="number" min="1" value={parameters.kernel_size[1]} onChange={(e) => updateKernel(1, e.target.value)} />
          </div>
        </Field>

        <Field label="Dilation iterations">
          <input className="form-input" type="number" min="0" value={parameters.dilation_iterations} onChange={(e) => update('dilation_iterations', Number(e.target.value))} />
        </Field>

        <Field label="Erosion iterations">
          <input className="form-input" type="number" min="0" value={parameters.erosion_iterations} onChange={(e) => update('erosion_iterations', Number(e.target.value))} />
        </Field>

        <Field label="Min area">
          <input className="form-input" type="number" min="0" value={parameters.min_area} onChange={(e) => update('min_area', Number(e.target.value))} />
        </Field>

        <Field label="Min width / height">
          <div className="grid grid-cols-2 gap-2">
            <input className="form-input" type="number" min="0" value={parameters.min_width} onChange={(e) => update('min_width', Number(e.target.value))} />
            <input className="form-input" type="number" min="0" value={parameters.min_height} onChange={(e) => update('min_height', Number(e.target.value))} />
          </div>
        </Field>

        <Field label="Padding">
          <input className="form-input" type="number" min="0" value={parameters.padding} onChange={(e) => update('padding', Number(e.target.value))} />
        </Field>

        <Field label="Connectivity">
          <select className="form-select" value={parameters.connectivity} onChange={(e) => update('connectivity', Number(e.target.value))}>
            <option value={4}>4-connected</option>
            <option value={8}>8-connected</option>
          </select>
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-300">
        <input type="checkbox" checked={parameters.invert} onChange={(e) => update('invert', e.target.checked)} className="accent-teal-500" />
        Invert threshold for dark text on light background
      </label>

      <button onClick={onRun} disabled={disabled} className={`btn w-full mt-5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'btn-primary'}`}>
        Run OpenCV Pipeline
      </button>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export default ParameterPanel;
