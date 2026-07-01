import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#071526]/70 backdrop-blur-md border-b border-white/5 h-20 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-slate-200 font-semibold text-lg tracking-wide hidden sm:block">
          Noisy Character Recognition
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium shadow-[0_0_10px_rgba(45,212,191,0.1)]">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
          OpenCV Base Pipeline
        </div>
      </div>
    </header>
  );
};

export default Header;
