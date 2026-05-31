'use client';
import { useState } from 'react';

export default function ExportPDFButton({ prData, review }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      // Helper functions
      function checkPageBreak(neededHeight = 20) {
        if (y + neededHeight > 275) {
          doc.addPage();
          y = 20;
        }
      }

      function addSectionTitle(text) {
        checkPageBreak(12);
        doc.setFillColor(30, 30, 30);
        doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F');
        doc.setTextColor(52, 211, 153);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin + 4, y + 6);
        y += 14;
      }

      function addText(text, color = [200, 200, 200], size = 9, isBold = false) {
        doc.setTextColor(...color);
        doc.setFontSize(size);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, contentWidth);
        checkPageBreak(lines.length * 5 + 3);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 3;
      }

      function addIssueCard(file, line, issue, suggestion, borderColor) {
        const cardHeight = 28;
        checkPageBreak(cardHeight + 4);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2);
        doc.setFillColor(25, 25, 25);
        doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'F');

        if (file) {
          doc.setFillColor(50, 50, 50);
          doc.roundedRect(margin + 3, y + 3, 50, 5, 1, 1, 'F');
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(file.length > 30 ? file.slice(0, 30) + '...' : file, margin + 5, y + 7);
        }

        doc.setTextColor(220, 220, 220);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        const issueLines = doc.splitTextToSize(issue, contentWidth - 8);
        doc.text(issueLines[0], margin + 4, y + 13);

        if (suggestion) {
          doc.setTextColor(130, 130, 130);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          const sLines = doc.splitTextToSize('→ ' + suggestion, contentWidth - 8);
          doc.text(sLines[0], margin + 4, y + 21);
        }
        y += cardHeight + 4;
      }

      // ── HEADER ──
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(margin, y, 12, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('CS', margin + 3, y + 8);

      doc.setTextColor(52, 211, 153);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('CodeSage AI', margin + 16, y + 9);

      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Powered by Gemini 2.5 Flash', pageWidth - margin, y + 9, { align: 'right' });
      y += 18;

      // Divider
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // ── PR TITLE ──
      doc.setTextColor(240, 240, 240);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(prData.title, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 7 + 4;

      // PR Meta pills
      const meta = [
        `👤 ${prData.author}`,
        `📁 ${prData.changedFiles} files`,
        `+${prData.additions} / -${prData.deletions}`,
        `${prData.baseBranch} ← ${prData.headBranch}`,
      ];
      doc.setFontSize(8);
      let mx = margin;
      meta.forEach(m => {
        const tw = doc.getTextWidth(m) + 8;
        doc.setFillColor(35, 35, 35);
        doc.roundedRect(mx, y, tw, 6, 1, 1, 'F');
        doc.setTextColor(150, 150, 150);
        doc.text(m, mx + 4, y + 4.5);
        mx += tw + 4;
      });
      y += 12;

      // ── SCORE + VERDICT ──
      doc.setFillColor(20, 40, 30);
      doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'F');
      doc.setTextColor(52, 211, 153);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(`${review.score}`, margin + 8, y + 13);
      doc.setFontSize(10);
      doc.setTextColor(100, 150, 120);
      doc.text('/10', margin + 22, y + 13);

      doc.setTextColor(240, 240, 240);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(review.verdict, margin + 40, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(8);
      const sumLines = doc.splitTextToSize(review.summary, contentWidth - 48);
      doc.text(sumLines[0], margin + 40, y + 14);
      y += 24;

      // ── CRITICAL ISSUES ──
      if (review.critical?.length > 0) {
        addSectionTitle('🚨 Critical Issues');
        review.critical.slice(0, 4).forEach(item => {
          addIssueCard(item.file, item.line, item.issue, item.suggestion, [220, 80, 80]);
        });
      }

      // ── WARNINGS ──
      if (review.warnings?.length > 0) {
        addSectionTitle('⚠️ Warnings');
        review.warnings.slice(0, 4).forEach(item => {
          addIssueCard(item.file, null, item.issue, item.suggestion, [200, 150, 50]);
        });
      }

      // ── IMPROVEMENTS ──
      if (review.improvements?.length > 0) {
        addSectionTitle('💡 Improvements');
        review.improvements.slice(0, 4).forEach(item => {
          checkPageBreak(12);
          doc.setFillColor(20, 30, 50);
          doc.roundedRect(margin, y, 28, 5, 1, 1, 'F');
          doc.setTextColor(100, 150, 220);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.text(item.category, margin + 2, y + 3.8);
          doc.setTextColor(200, 200, 200);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          const sLines = doc.splitTextToSize(item.suggestion, contentWidth - 35);
          doc.text(sLines[0], margin + 32, y + 3.8);
          y += 10;
        });
        y += 2;
      }

      // ── POSITIVES ──
      if (review.positives?.length > 0) {
        addSectionTitle('✅ What\'s Good');
        review.positives.slice(0, 4).forEach(item => {
          checkPageBreak(8);
          doc.setTextColor(52, 211, 153);
          doc.setFontSize(9);
          doc.text('•', margin + 2, y);
          doc.setTextColor(200, 200, 200);
          const pLines = doc.splitTextToSize(item, contentWidth - 10);
          doc.text(pLines[0], margin + 8, y);
          y += 7;
        });
        y += 4;
      }

      // ── TESTING NOTES ──
      if (review.testingNotes) {
        addSectionTitle('🧪 Testing Notes');
        addText(review.testingNotes);
      }

      // ── FOOTER ──
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(40, 40, 40);
        doc.setLineWidth(0.3);
        doc.line(margin, 285, pageWidth - margin, 285);
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('CodeSage AI — codesage-ai.vercel.app', margin, 290);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
      }

      // Save PDF
      const filename = `codesage-review-${prData.author}-${Date.now()}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('PDF export failed. Please try again.');
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
      {loading ? 'Generating PDF...' : 'Export PDF'}
    </button>
  );
}
