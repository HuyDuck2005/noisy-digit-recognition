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
      setError(err.message || 'Không tải được trạng thái dataset.');
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
          <h2 className="page-eyebrow">Phase sau</h2>
          <h1 className="page-title">Train model trong tương lai</h1>
          <p className="page-sub">Hoàn thiện bbox baseline trước. Phase hiện tại chỉ tiền xử lý nâng cao + bbox.</p>
        </div>
        <button onClick={loadStatus} disabled={loading} className="btn btn-primary">{loading ? 'Đang kiểm tra...' : 'Kiểm tra dataset'}</button>
      </div>

      {error && <div className="card text-red-400 border border-red-400/20">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Info label="Phase hiện tại" value="Preprocess + bbox" />
        <Info label="Model đã train" value="Không" />
        <Info label="Nhận dạng" value="Tắt" />
        <Info label="Dataset" value={status?.downloaded ? 'Đã có' : 'Chưa cần'} />
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="card-title">Dataset phase sau</h3>
            <p className="card-sub">Phase hiện tại chưa cần dataset.</p>
          </div>
          <button disabled className="btn btn-secondary opacity-45 cursor-not-allowed" title="Finish bbox baseline, add datasets, then implement training/export.">
            Train model đang tắt
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mục đích</th>
                <th>Cần ngay</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(status?.datasets || []).map((dataset) => (
                <tr key={dataset.name}>
                  <td className="font-bold text-slate-200">{dataset.name}</td>
                  <td>{dataset.purpose}</td>
                  <td>{dataset.required_now ? 'Có' : 'Không'}</td>
                  <td><span className="badge badge-blue">{dataset.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Các bước phase sau</h3>
        <ol className="list-decimal pl-5 text-sm text-slate-300 space-y-2 mt-3">
          <li>Chuẩn bị SynthText, VinText, Chars74K, TextOCR hoặc NOD khi bắt đầu training.</li>
          <li>Train detector hoặc module nhận dạng sau khi bbox baseline ổn định.</li>
          <li>Export ONNX hoặc runtime artifact khác.</li>
          <li>Thay module bbox/nhận dạng phía sau API contract hiện tại.</li>
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
