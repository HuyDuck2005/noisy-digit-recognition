import React, { useRef, useState } from 'react';

const DragDropZone = ({ onImageSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === 'dragenter' || event.type === 'dragover');
  };

  const validateAndPassFile = (file) => {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please choose a JPG or PNG image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image exceeds the 10MB upload limit.');
      return;
    }
    setError('');
    onImageSelect(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files?.[0]) validateAndPassFile(event.dataTransfer.files[0]);
  };

  const handleChange = (event) => {
    if (event.target.files?.[0]) validateAndPassFile(event.target.files[0]);
  };

  return (
    <div className="w-full">
      <div
        className="relative flex flex-col items-center justify-center w-full h-56 rounded-2xl cursor-pointer transition-all duration-300"
        style={{
          background: dragActive ? 'rgba(13,148,136,0.12)' : 'rgba(13,30,60,0.5)',
          border: dragActive ? '2px dashed #2dd4bf' : '2px dashed rgba(56,189,248,0.25)',
          boxShadow: dragActive ? '0 0 30px rgba(45,212,191,0.15) inset' : 'none',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all" style={{ background: dragActive ? 'rgba(45,212,191,0.2)' : 'rgba(56,189,248,0.08)', border: `1px solid ${dragActive ? 'rgba(45,212,191,0.5)' : 'rgba(56,189,248,0.2)'}` }}>
          <svg className="w-8 h-8 transition-transform" style={{ color: dragActive ? '#2dd4bf' : '#38bdf8', transform: dragActive ? 'scale(1.1)' : 'scale(1)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <p className="font-bold text-sm mb-1" style={{ color: '#e2e8f0' }}>
          {dragActive ? 'Drop image here' : 'Drag an image here or click to choose'}
        </p>
        <p className="text-xs" style={{ color: '#64748b' }}>Supports JPG and PNG, up to 10MB</p>

        <div className="flex gap-2 mt-4">
          {['JPG', 'PNG'].map((format) => (
            <span key={format} className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
              {format}
            </span>
          ))}
        </div>

        <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/jpg,image/png" onChange={handleChange} />
      </div>

      {error && (
        <p className="mt-3 text-xs font-semibold text-center px-4 py-2 rounded-lg" style={{ color: '#fca5a5', background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default DragDropZone;
