'use client';
import Editor from '@monaco-editor/react';

export default function DiffViewer({ diff }) {
  return (
    <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
      {/* Dev terminal/window control header */}
      <div className="px-5 py-3.5 border-b border-white/5 bg-slate-950/70 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Mock OSX-like terminal windows dots */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs font-mono font-bold text-gray-400 ml-2 tracking-wide flex items-center gap-1.5">
            <span>📄</span>
            <span>pull_request.diff</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-slate-800 text-gray-400 px-2 py-0.5 rounded border border-white/5">
            READ-ONLY VIEW
          </span>
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative p-1 bg-slate-950/40">
        <Editor
          height="550px"
          defaultLanguage="diff"
          value={diff}
          theme="vs-dark"
          loading={
            <div className="flex flex-col items-center justify-center h-[550px] bg-slate-950/60 text-slate-400 gap-3">
              <svg className="animate-spin h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs font-mono tracking-wider">Mounting Monaco Diff Engine...</span>
            </div>
          }
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            fontFamily: "'JetBrains Mono', var(--font-mono), monospace",
            renderWhitespace: 'selection',
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8
            },
            contextmenu: false,
            folding: true,
            cursorBlinking: 'smooth'
          }}
        />
      </div>
    </div>
  );
}
