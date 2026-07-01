import React, { useEffect, useState } from 'react';
import { getDatasetStatus } from '../services/api';

const ModelManager = () => {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      setStatus(await getDatasetStatus());
    } catch (err) {
      setError(err.message || 'Could not load dataset status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="flex flex-col gap-6 anim-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="page-eyebrow">Management</h2>
          <h1 className="page-title">Model & Dataset Manager</h1>
          <p className="page-sub">Current phase: OpenCV base, no training, deterministic mock recognizer.</p>
        </div>
        <button onClick={loadStatus} disabled={loading} className="btn btn-primary">{loading ? 'Checking...' : 'Check datasets'}</button>
      </div>

      {error && <div className="card text-red-400 border border-red-400/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Info label="Current phase" value={status?.current_phase || 'opencv_base_no_training'} />
        <Info label="Current recognizer" value={status?.model_status || 'mock_recognizer'} />
        <Info label="Dataset status" value={status?.downloaded ? 'Downloaded' : 'Not downloaded'} />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="card-title">Suggested future datasets</h3>
            <p className="card-sub">Not required for the current MVP.</p>
          </div>
          <button disabled className="btn btn-secondary opacity-45 cursor-not-allowed" title="Download datasets and implement training pipeline first.">
            Train model disabled
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Required now</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(status?.datasets || []).map((dataset) => (
                <tr key={dataset.name}>
                  <td className="font-bold text-slate-200">{dataset.name}</td>
                  <td>{dataset.purpose}</td>
                  <td>{dataset.required_now ? 'Yes' : 'No'}</td>
                  <td><span className="badge badge-blue">{dataset.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!status?.datasets?.length && (
          <p className="text-sm text-slate-500 mt-4">Dataset status is unavailable while backend is offline.</p>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">No Trained Model Yet</h3>
        <p className="card-sub mt-2">This screen intentionally does not upload a fake model. Add dataset download, training, evaluation, and model loading support before enabling training or model upload.</p>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ fontSize: 24, color: '#2dd4bf' }}>{value}</div>
  </div>
);

export default ModelManager;
