'use client';
import { useState } from 'react';

export default function ExportPDFButton({ prData, review }) {
  const [loading, setLoading] = useState(false);

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    setLoading(true);
    try {
      // Build structured Markdown report
      let mdContent = `# CodeSage AI — Pull Request Review Report\n\n`;
      mdContent += `**PR Title**: ${prData.title}\n`;
      mdContent += `**Author**: @${prData.author}\n`;
      mdContent += `**Branch**: \`${prData.baseBranch}\` ← \`${prData.headBranch}\`\n`;
      mdContent += `**Stats**: 📁 ${prData.changedFiles} files changed | +${prData.additions} insertions | -${prData.deletions} deletions\n\n`;
      mdContent += `---\n\n`;

      mdContent += `## 📊 Score & Verdict\n\n`;
      mdContent += `### **Score**: ${review.score}/10\n`;
      mdContent += `### **Verdict**: ${review.verdict}\n\n`;
      if (review.summary) {
        mdContent += `> ${review.summary}\n\n`;
      }
      mdContent += `---\n\n`;

      // Critical Issues
      if (review.critical?.length > 0) {
        mdContent += `## 🚨 Critical Issues\n\n`;
        review.critical.forEach((item, index) => {
          mdContent += `### ${index + 1}. 🔴 ${item.file}${item.line ? ` (Line ${item.line})` : ''}\n`;
          mdContent += `* **Issue**: ${item.issue}\n`;
          if (item.suggestion) {
            mdContent += `* **Suggestion**: ${item.suggestion}\n`;
          }
          mdContent += `\n`;
        });
        mdContent += `---\n\n`;
      }

      // Warnings
      if (review.warnings?.length > 0) {
        mdContent += `## ⚠️ Warnings\n\n`;
        review.warnings.forEach((item, index) => {
          mdContent += `### ${index + 1}. 🟡 ${item.file}${item.line ? ` (Line ${item.line})` : ''}\n`;
          mdContent += `* **Issue**: ${item.issue}\n`;
          if (item.suggestion) {
            mdContent += `* **Suggestion**: ${item.suggestion}\n`;
          }
          mdContent += `\n`;
        });
        mdContent += `---\n\n`;
      }

      // Improvements
      if (review.improvements?.length > 0) {
        mdContent += `## 💡 Improvements\n\n`;
        review.improvements.forEach((item, index) => {
          mdContent += `### ${index + 1}. 🔵 ${item.category || 'Refactoring'}\n`;
          mdContent += `* **File**: ${item.file || 'General'}\n`;
          mdContent += `* **Suggestion**: ${item.suggestion}\n`;
          mdContent += `\n`;
        });
        mdContent += `---\n\n`;
      }

      // Positives
      if (review.positives?.length > 0) {
        mdContent += `## ✅ What's Good\n\n`;
        review.positives.forEach(item => {
          mdContent += `* ${item}\n`;
        });
        mdContent += `\n---\n\n`;
      }

      // Testing Notes
      if (review.testingNotes) {
        mdContent += `## 🧪 Testing Notes\n\n`;
        mdContent += `${review.testingNotes}\n\n`;
        mdContent += `---\n\n`;
      }

      mdContent += `*Powered by Gemini 2.5 Flash · CodeSage AI*\n`;

      const filename = `codesage-review-${prData.author}-${Date.now()}.md`;
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });

      // Native Save As file picker if supported
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Markdown Document',
              accept: { 'text/markdown': ['.md'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('File System Access API error, falling back:', err);
            downloadBlob(blob, filename);
          }
        }
      } else {
        downloadBlob(blob, filename);
      }
    } catch (err) {
      console.error('Markdown export error:', err);
      alert('Markdown export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M12 9v6m2-8H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2z" />
        </svg>
      )}
      {loading ? 'Generating Markdown...' : 'Export Markdown'}
    </button>
  );
}
