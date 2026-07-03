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
        <h2 className="page-eyebrow">Tổng quan</h2>
        <h1 className="page-title">Advanced Classical CV</h1>
        <p className="page-sub">Phase hiện tại: tiền xử lý + bbox ứng viên. Nhận dạng đang tắt.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatusCard label="Backend" value={backendOnline ? 'Online' : 'Offline'} tone={backendOnline ? 'good' : 'bad'} />
        <StatusCard label="Mode" value="Classical CV" />
        <StatusCard label="Nhận dạng" value="Tắt" />
        <StatusCard label="Dataset" value={datasetStatus?.downloaded ? 'Đã có' : 'Chưa cần'} />
        <StatusCard label="Lượt local" value={history.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="card flex flex-col h-full">
          <h3 className="card-title">OpenCV BBox Pipeline</h3>
          <p className="card-sub mb-6">Chạy tiền xử lý nâng cao, đề xuất vùng, lọc bbox, crop và xuất artifact.</p>
          <button
            onClick={() => navigate('/process')}
            className="flex-1 w-full min-h-[200px] border-2 border-dashed border-sky-500/30 rounded-xl flex flex-col items-center justify-center bg-[rgba(56,189,248,0.05)] cursor-pointer hover:bg-[rgba(56,189,248,0.1)] hover:border-teal-500 transition-all group"
          >
            <span className="text-teal font-bold text-lg">Mở BBox Workspace</span>
            <span className="text-muted text-sm mt-1">Chỉ tạo bbox ứng viên</span>
          </button>
        </div>

        <div className="card flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="card-title">Lịch sử local gần đây</h3>
              <p className="card-sub">Chỉ lưu trên trình duyệt. Chưa có database.</p>
            </div>
            <button onClick={() => navigate('/history')} className="btn btn-sm btn-ghost">Xem tất cả</button>
          </div>

          {recent.length ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>BBox ứng viên</th>
                    <th>BBox có thể dính</th>
                    <th>Thời gian</th>
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
              <p className="text-sm text-slate-500">Chưa có lịch sử xử lý local.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Chưa có model đã train</h3>
        <p className="card-sub mt-2">Phase này không báo nhận dạng ký tự hay metric nhận dạng. Hệ thống chỉ trích bbox ứng viên.</p>
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
