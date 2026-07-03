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
          <h2 className="page-eyebrow">Lịch sử</h2>
          <h1 className="page-title">Lượt chạy BBox local</h1>
          <p className="page-sub">Chỉ lưu trong trình duyệt. Chưa có database.</p>
        </div>
        <button onClick={clearHistory} disabled={!history.length} className="btn btn-sm btn-ghost disabled:opacity-40">Xóa lịch sử local</button>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Tìm theo tên file hoặc result ID..."
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
                <th>BBox ứng viên</th>
                <th>BBox có thể dính</th>
                <th>Nhiễu đã lọc</th>
                <th>Thời gian</th>
                <th>Mode</th>
                <th>Artifact</th>
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
                      {item.output_image_url && <a className="btn btn-sm btn-secondary" href={item.output_image_url} target="_blank" rel="noreferrer">Ảnh</a>}
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
            <p className="font-bold text-slate-400">Chưa có lịch sử local</p>
            <p className="text-xs mt-1" style={{ color: '#64748b' }}>Chạy Advanced BBox Pipeline để thêm dữ liệu vào đây.</p>
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
