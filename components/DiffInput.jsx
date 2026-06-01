'use client';
import { useState } from 'react';

export default function DiffInput({ onReview, loading }) {
  const [diff, setDiff] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (diff.trim()) onReview(diff.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={diff}
        onChange={e => setDiff(e.target.value)}
        placeholder={`Paste your raw git diff here...\n\nExample:\ndiff --git a/index.js b/index.js\n--- a/index.js\n+++ b/index.js\n@@ -1,5 +1,6 @@\n+const x = 1;`}
        rows={10}
        disabled={loading}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition font-mono resize-none"
      />
      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          Run <code className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">git diff HEAD</code> in your terminal and paste the output above
        </p>
        <button
          type="submit"
          disabled={loading || !diff.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
        >
          {loading ? 'Reviewing...' : 'Review Diff →'}
        </button>
      </div>
    </form>
  );
}
