// src/components/Result/BoundingBoxTable.jsx
import React, { useState } from 'react';

const confidenceColor = (c) => {
  if (c >= 0.85) return { bg: 'rgba(34,197,94,0.12)', text: '#86efac', bar: '#22c55e', label: 'Cao' };
  if (c >= 0.6) return { bg: 'rgba(234,179,8,0.12)', text: '#fde047', bar: '#eab308', label: 'Trung bình' };
  return { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', bar: '#ef4444', label: 'Thấp' };
};

const BoundingBoxTable = ({ boxes }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [customLabels, setCustomLabels] = useState({});
  const [sortBy, setSortBy] = useState('index');

  const defaultBoxes = boxes || [
    { index: 1, x: 12, y: 35, width: 24, height: 40, area: 960, label: '7', confidence: 0.94 },
    { index: 2, x: 80, y: 31, width: 22, height: 39, area: 858, label: 'A', confidence: 0.88 },
    { index: 3, x: 140, y: 29, width: 25, height: 42, area: 1050, label: 'B', confidence: 0.55 },
  ];

  const sorted = [...defaultBoxes].sort((a, b) => {
    if (sortBy === 'confidence') return b.confidence - a.confidence;
    if (sortBy === 'label') return (a.label || '').localeCompare(b.label || '');
    return a.index - b.index;
  });

  const handleExportCSV = () => {
    const rows = [['#', 'X', 'Y', 'Rộng', 'Cao', 'Diện tích', 'Nhãn', 'Độ tin cậy']];
    defaultBoxes.forEach((b) =>
      rows.push([b.index, b.x, b.y, b.width, b.height, b.area, customLabels[b.index] ?? b.label, b.confidence])
    );
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'bounding_boxes.csv'; a.click();
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(13,30,60,0.7)', border: '1px solid rgba(56,189,248,0.15)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
        <div>
          <h3 className="font-bold text-slate-200 text-sm">Bảng Tọa Độ & Nhãn Dự Đoán</h3>
          <p className="text-[11px] mt-0.5" style={{ color: '#475569' }}>
            {defaultBoxes.length} ký tự · Sắp xếp theo:{' '}
            {['index', 'confidence', 'label'].map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="ml-1 underline transition-colors"
                style={{ color: sortBy === s ? '#2dd4bf' : '#64748b' }}
              >
                {s === 'index' ? 'thứ tự' : s === 'confidence' ? 'độ tin cậy' : 'nhãn'}
              </button>
            ))}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
          style={{ background: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'rgba(7,21,38,0.8)' }}>
              {['#', 'Tọa độ', 'Kích thước', 'Diện tích', 'Độ tin cậy', 'Nhãn CNN', 'Hành động'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest" style={{ color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((box, i) => {
              const conf = confidenceColor(box.confidence);
              const displayLabel = customLabels[box.index] ?? box.label;
              const isEdited = customLabels[box.index] !== undefined;
              const isEditing = editingIndex === box.index;

              return (
                <tr
                  key={box.index}
                  className="transition-all duration-150"
                  style={{
                    borderTop: '1px solid rgba(56,189,248,0.06)',
                    background: i % 2 === 0 ? 'rgba(13,30,60,0.3)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56,189,248,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(13,30,60,0.3)' : 'transparent'; }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold" style={{ color: '#38bdf8' }}>#{box.index}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>
                    ({box.x}, {box.y})
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>
                    {box.width} × {box.height}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#64748b' }}>
                    {box.area?.toLocaleString()} px²
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${box.confidence * 100}%`, background: conf.bar }}
                        />
                      </div>
                      <span className="text-xs font-bold" style={{ color: conf.text }}>
                        {(box.confidence * 100).toFixed(0)}%
                      </span>
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: conf.bg, color: conf.text }}
                      >
                        {conf.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <input
                        type="text"
                        maxLength={1}
                        value={displayLabel}
                        onChange={(e) => setCustomLabels({ ...customLabels, [box.index]: e.target.value })}
                        className="w-9 text-center font-black text-base rounded-lg py-1 outline-none"
                        style={{ background: 'rgba(13,148,136,0.15)', color: '#2dd4bf', border: '2px solid #2dd4bf' }}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl font-black text-lg"
                        style={{
                          background: isEdited ? 'rgba(234,179,8,0.15)' : 'rgba(56,189,248,0.1)',
                          color: isEdited ? '#fde047' : '#e2e8f0',
                          border: `1px solid ${isEdited ? 'rgba(234,179,8,0.3)' : 'rgba(56,189,248,0.2)'}`,
                        }}
                      >
                        {displayLabel}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setEditingIndex(isEditing ? null : box.index)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: isEditing ? 'rgba(45,212,191,0.15)' : 'rgba(56,189,248,0.08)',
                        color: isEditing ? '#2dd4bf' : '#64748b',
                      }}
                    >
                      {isEditing ? '✓ Lưu' : 'Sửa nhãn'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}>
        <p className="text-[11px]" style={{ color: '#475569' }}>
          Kết quả CNN — Nhãn đã sửa:{' '}
          <span style={{ color: '#fde047' }}>{Object.keys(customLabels).length}</span>
        </p>
        <p className="text-[11px]" style={{ color: '#2dd4bf' }}>
          Avg confidence:{' '}
          {(defaultBoxes.reduce((s, b) => s + b.confidence, 0) / defaultBoxes.length * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
};

export default BoundingBoxTable;
