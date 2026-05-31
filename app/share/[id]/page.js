'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReviewOutput from '@/components/ReviewOutput';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function decompressData(base64) {
  let str = base64.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const stream = new Blob([bytes]).stream();
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(decompressedStream);
  const blob = await response.blob();
  const text = await blob.text();
  return JSON.parse(text);
}

export default function SharedReviewPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        if (!id) return;

        // Clean the ID of any accidentally copied whitespaces, newlines, tabs, or %20 spaces
        const cleanId = decodeURIComponent(id)
          .replace(/\s+/g, '')
          .replace(/%20/g, '');

        // If the cleaned id parameter is long, it is a self-contained compressed URL link
        if (cleanId.length > 20) {
          try {
            const decompressed = await decompressData(cleanId);
            setData(decompressed);
            setLoading(false);
            return;
          } catch (decErr) {
            console.error('Decompression error:', decErr);
            throw new Error(`Invalid or corrupted share link format: ${decErr.message}`);
          }
        }

        // Otherwise fallback to reading from Firestore database
        if (!db) {
          throw new Error('Database connection is not available');
        }
        const docRef = doc(db, 'sharedReviews', cleanId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error('Review not found');
        }
        setData(docSnap.data());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-sm mx-auto mb-4">CS</div>
          <p className="text-gray-400 text-sm">Loading review...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-sm mx-auto mb-4">CS</div>
          <p className="text-red-400 text-sm">⚠️ {error}</p>
          <p className="text-gray-500 text-xs mt-2">This review may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-sm">CS</div>
        <h1 className="text-lg font-semibold">CodeSage AI</h1>
        <span className="text-gray-500 text-sm ml-auto">Shared Review</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Shared badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs bg-emerald-900 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full">
            🔗 Shared Review — View Only
          </span>
        </div>

        {/* PR Meta */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-lg mb-1">{data.prData.title}</h3>
          <div className="flex gap-4 text-sm text-gray-400 flex-wrap">
            <span>👤 {data.prData.author}</span>
            <span>📁 {data.prData.changedFiles} files</span>
            <span className="text-green-400">+{data.prData.additions}</span>
            <span className="text-red-400">-{data.prData.deletions}</span>
            <span>{data.prData.baseBranch} ← {data.prData.headBranch}</span>
          </div>
        </div>

        {/* Review Output */}
        <ReviewOutput review={data.review} />

        {/* Footer CTA */}
        <div className="mt-10 text-center border-t border-gray-800 pt-8">
          <p className="text-gray-400 text-sm mb-3">Want AI reviews for your own PRs?</p>
          <a
            href="/"
            className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition"
          >
            Try CodeSage AI Free →
          </a>
        </div>
      </div>
    </main>
  );
}
