import React, { useMemo, useState } from 'react';
import { resolveApiUrl } from '../../services/api';

const SORTERS = {
  index: (a, b) => a.index - b.index,
  line: (a, b) => (a.line_index - b.line_index) || (a.order_in_line - b.order_in_line),
  x: (a, b) => a.x - b.x,
  y: (a, b) => a.y - b.y,
  area: (a, b) => b.area - a.area,
  aspect_ratio: (a, b) => b.aspect_ratio - a.aspect_ratio,
  fill_ratio: (a, b) => b.fill_ratio - a.fill_ratio,
  status: (a, b) => String(a.status).localeCompare(String(b.status)),
};

const statusStyle = (status) => {
  if (status === 'candidate') return { color: '#86efac', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' };
  if (status === 'possible_connected_characters') return { color: '#fdba74', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' };
  return { color: '#fca5a5', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' };
};

const BoundingBoxTable = ({ boxes = [] }) => {
  const [sortBy, setSortBy] = useState('index');
  const [statusFilter, setStatusFilter] = useState('all');
  const [preview, setPreview] = useState(null);

  const statuses = useMemo(() => ['all', ...Array.from(new Set(boxes.map((box) => box.status)))], [boxes]);
  const filtered = useMemo(() => {
    const rows = statusFilter === 'all' ? boxes : boxes.filter((box) => box.status === statusFilter);
    return [...rows].sort(SORTERS[sortBy] || SORTERS.index);
  }, [boxes, sortBy, statusFilter]);

  const exportCSV = () => {
    const rows = [
      ['index', 'global_order', 'line_index', 'order_in_line', 'x', 'y', 'width', 'height', 'area', 'aspect_ratio', 'fill_ratio', 'status', 'source_branch', 'crop_url'],
      ...filtered.map((box) => [
        box.index,
        box.global_order,
        box.line_index,
        box.order_in_line,
        box.x,
        box.y,
        box.width,
        box.height,
        box.area,
        box.aspect_ratio,
        box.fill_ratio,
        box.status,
        box.source_branch || '',
        box.crop_url || '',
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'candidate_boxes.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}>
      <div className="px-5 py-4 flex flex-wrap gap-3 items-center justify-between" style={{ borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
        <div>
          <h3 className="font-bold text-slate-200 text-sm">Candidate Bounding Boxes</h3>
          <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>These are image-processing candidates, not character IDs.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 180, padding: '8px 10px', fontSize: 12 }}>
            {statuses.map((status) => <option key={status} value={status}>Status: {status}</option>)}
          </select>
          <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 170, padding: '8px 10px', fontSize: 12 }}>
            {Object.keys(SORTERS).map((key) => <option key={key} value={key}>Sort: {key}</option>)}
          </select>
          <button onClick={exportCSV} disabled={!filtered.length} className="btn btn-sm btn-secondary disabled:opacity-40">CSV</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(7,21,38,0.8)' }}>
              {['#', 'Crop', 'Order', 'BBox', 'Area', 'Ratio', 'Fill', 'Status', 'Branch', 'Crop URL'].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest" style={{ color: '#64748b' }}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((box, rowIndex) => {
              const style = statusStyle(box.status);
              const cropUrl = resolveApiUrl(box.crop_url);
              return (
                <tr key={`${box.index}-${box.crop_url}`} style={{ borderTop: '1px solid rgba(56,189,248,0.06)', background: rowIndex % 2 === 0 ? 'rgba(13,30,60,0.3)' : 'transparent' }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#38bdf8' }}>#{box.index}</td>
                  <td className="px-4 py-3">
                    {box.crop_url ? (
                      <button onClick={() => setPreview(cropUrl)} className="block">
                        <img src={cropUrl} alt={`crop ${box.index}`} className="w-12 h-12 object-contain rounded-lg" style={{ background: '#040d1a', border: '1px solid rgba(56,189,248,0.12)' }} />
                      </button>
                    ) : <span className="text-xs text-slate-500">None</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    {box.global_order} / L{box.line_index}.{box.order_in_line}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>{box.x}, {box.y}, {box.width}, {box.height}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{box.area}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{Number(box.aspect_ratio || 0).toFixed(3)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{Number(box.fill_ratio || 0).toFixed(3)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                      {box.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{box.source_branch || 'main'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>{box.crop_url || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!filtered.length && (
        <div className="py-12 text-center">
          <p className="font-bold text-slate-400">No candidate boxes</p>
          <p className="text-xs mt-1" style={{ color: '#64748b' }}>Try adaptive/Sauvola, lower min_area, or enable multi-branch.</p>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={() => setPreview(null)}>
          <div className="rounded-2xl p-4" style={{ background: '#071526', border: '1px solid rgba(56,189,248,0.2)' }}>
            <img src={preview} alt="Large crop preview" className="max-w-[80vw] max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default BoundingBoxTable;
