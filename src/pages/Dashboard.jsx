import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatasetStatus, healthCheck } from '../services/api';
import { HISTORY_STORAGE_KEY } from './ImageProcess';

const Dashboard = () => {
  const navigate = useNavigate();
  const [backendOnline, setBackendOnline] = useState(false);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(readHistory());
    healthCheck().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
    getDatasetStatus().then(setDatasetStatus).catch(() => setDatasetStatus(null));
  }, []);

  const recent = history.slice(0, 5);

  return (
    <div className="flex flex-col gap-8 anim-in">
      <div>
        <h2 className="page-eyebrow">Overview</h2>
        <h1 className="page-title">Advanced Classical CV</h1>
        <p className="page-sub">Current phase: preprocessing + candidate bounding boxes only. Recognition disabled.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatusCard label="Backend" value={backendOnline ? 'Online' : 'Offline'} tone={backendOnline ? 'good' : 'bad'} />
        <StatusCard label="Current mode" value="Advanced Classical CV" />
        <StatusCard label="Recognition" value="Disabled" />
        <StatusCard label="Dataset" value={datasetStatus?.downloaded ? 'Downloaded' : 'Not required'} />
        <StatusCard label="Local runs" value={history.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="card flex flex-col h-full">
          <h3 className="card-title">OpenCV BBox Pipeline</h3>
          <p className="card-sub mb-6">Run advanced preprocessing, region proposals, box filtering, crops, and output artifacts.</p>
          <button
            onClick={() => navigate('/process')}
            className="flex-1 w-full min-h-[200px] border-2 border-dashed border-sky-500/30 rounded-xl flex flex-col items-center justify-center bg-[rgba(56,189,248,0.05)] cursor-pointer hover:bg-[rgba(56,189,248,0.1)] hover:border-teal-500 transition-all group"
          >
            <span className="text-teal font-bold text-lg">Open BBox Workspace</span>
            <span className="text-muted text-sm mt-1">Candidate bounding boxes only</span>
          </button>
        </div>

        <div className="card flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="card-title">Recent local history</h3>
              <p className="card-sub">Local browser storage only. No database yet.</p>
            </div>
            <button onClick={() => navigate('/history')} className="btn btn-sm btn-ghost">View all</button>
          </div>

          {recent.length ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Candidate boxes</th>
                    <th>Connected boxes</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.result_id}>
                      <td className="font-mono text-sm">{item.filename}</td>
                      <td><span className="badge badge-teal">{item.candidate_boxes ?? 0}</span></td>
                      <td>{item.possible_connected_characters ?? 0}</td>
                      <td>{item.processing_time_ms}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center rounded-xl" style={{ background: 'rgba(7,21,38,0.35)', minHeight: 180 }}>
              <p className="text-sm text-slate-500">No local processing history yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">No trained model</h3>
        <p className="card-sub mt-2">This phase does not report character recognition or OCR metrics. It only extracts candidate bounding boxes.</p>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value, tone = 'neutral' }) => {
  const color = tone === 'good' ? '#86efac' : tone === 'bad' ? '#fca5a5' : '#2dd4bf';
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: 28, color }}>{value}</div>
    </div>
  );
};

const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export default Dashboard;
