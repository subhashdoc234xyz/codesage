'use client';
import { useState, useEffect } from 'react';

const PLACEHOLDERS = [
  'https://github.com/facebook/react/pull/31377',
  'https://github.com/vercel/next.js/pull/65000',
  'https://github.com/tailwindlabs/tailwindcss/pull/14000',
  'https://github.com/owner/repository/pull/number'
];

export default function PRInput({ onReview, loading }) {
  const [url, setUrl] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Rotate placeholders every 3 seconds for dynamic layout feel
  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  function handleSubmit(e) {
    e.preventDefault();
    if (url.trim()) {
      onReview(url.trim());
    }
  }

  return (
    <div className="w-full glass-panel rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background Gradient Decorative Orb */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="pr-url" className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span>🔗 GitHub Pull Request URL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          </label>
          <div className="flex flex-col md:flex-row gap-3 relative">
            <div className="relative flex-1 group">
              <input
                id="pr-url"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={PLACEHOLDERS[placeholderIdx]}
                className={`w-full bg-slate-900/60 border ${
                  url ? 'border-emerald-500/60 text-white' : 'border-slate-800'
                } group-hover:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 outline-none transition-all duration-300 backdrop-blur-sm`}
                disabled={loading}
                required
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition"
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-gray-500 text-white px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-emerald-950/20 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Reviewing...</span>
                </>
              ) : (
                <>
                  <span>Review PR</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
