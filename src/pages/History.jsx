import React, { useEffect, useMemo, useState } from 'react';
import { HISTORY_STORAGE_KEY } from './ImageProcess';

const History = () => {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase();
    return history.filter((item) =>
      item.filename?.toLowerCase().includes(keyword) ||
      item.result_id?.toLowerCase().includes(keyword)
    );
  }, [history, search]);

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setHistory([]);
  };

  return (
    <div className="flex flex-col gap-6 anim-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="page-eyebrow">History</h2>
          <h1 className="page-title">Local BBox Runs</h1>
          <p className="page-sub">Local history only. No database yet.</p>
        </div>
        <button onClick={clearHistory} disabled={!history.length} className="btn btn-sm btn-ghost disabled:opacity-40">Clear local history</button>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search by filename or result ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="form-input mb-4"
        />

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Result ID</th>
                <th>File</th>
                <th>Candidate boxes</th>
                <th>Connected boxes</th>
                <th>Removed noise</th>
                <th>Time</th>
                <th>Mode</th>
                <th>Artifacts</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.result_id}>
                  <td className="font-mono text-xs" style={{ color: '#38bdf8' }}>{item.result_id}</td>
                  <td>{item.filename}</td>
                  <td>{item.candidate_boxes ?? 0}</td>
                  <td>{item.possible_connected_characters ?? 0}</td>
                  <td>{item.removed_noise_components ?? 0}</td>
                  <td>{item.processing_time_ms}ms</td>
                  <td>{item.mode}</td>
                  <td>
                    <div className="flex gap-2">
                      {item.output_image_url && <a className="btn btn-sm btn-secondary" href={item.output_image_url} target="_blank" rel="noreferrer">Image</a>}
                      {item.output_txt_url && <a className="btn btn-sm btn-secondary" href={item.output_txt_url} target="_blank" rel="noreferrer">Text</a>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filtered.length && (
          <div className="py-14 text-center">
            <p className="font-bold text-slate-400">No local history found</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>Run the Advanced BBox Pipeline to add entries here.</p>
          </div>
        )}
      </div>
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

export default History;
