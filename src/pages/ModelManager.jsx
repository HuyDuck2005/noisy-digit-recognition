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
          <h2 className="page-eyebrow">Future Work</h2>
          <h1 className="page-title">Future Model Training</h1>
          <p className="page-sub">Finish the bbox baseline first. Current phase is advanced preprocessing + bbox only.</p>
        </div>
        <button onClick={loadStatus} disabled={loading} className="btn btn-primary">{loading ? 'Checking...' : 'Check datasets'}</button>
      </div>

      {error && <div className="card text-red-400 border border-red-400/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Info label="Current phase" value="Advanced preprocessing + bbox only" />
        <Info label="Model trained" value="No" />
        <Info label="Recognition" value="Disabled" />
        <Info label="Dataset" value={status?.downloaded ? 'Downloaded' : 'Not required yet'} />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="card-title">Future datasets</h3>
            <p className="card-sub">Not required for the current phase.</p>
          </div>
          <button disabled className="btn btn-secondary opacity-45 cursor-not-allowed" title="Finish bbox baseline, add datasets, then implement training/export.">
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
      </div>

      <div className="card">
        <h3 className="card-title">Future steps</h3>
        <ol className="list-decimal pl-5 text-sm text-slate-300 space-y-2 mt-3">
          <li>Download SynthText, VinText, Chars74K, TextOCR, or NOD when the training phase starts.</li>
          <li>Train a detector or recognition module after the bbox baseline is stable.</li>
          <li>Export ONNX or another runtime artifact.</li>
          <li>Replace the bbox or recognition module behind the current API contract.</li>
        </ol>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-label">{label}</div>
    <div className="stat-value" style={{ fontSize: 22, color: '#2dd4bf' }}>{value}</div>
  </div>
);

export default ModelManager;
