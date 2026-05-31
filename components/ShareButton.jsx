'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

async function compressData(data) {
  const str = JSON.stringify(data);
  const stream = new Blob([str], { type: 'text/plain' }).stream();
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
  const response = new Response(compressedStream);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default function ShareButton({ prData, review }) {
  const [status, setStatus] = useState('idle'); // idle | loading | copied | error

  async function handleShare() {
    setStatus('loading');
    try {
      let shareUrl = '';
      
      // Strip out the heavy raw diff and description to keep URLs short and database lightweight
      const { diff, description, ...prDataWithoutDiff } = prData;

      try {
        if (!db) {
          throw new Error('Database not initialized');
        }

        const shareId = nanoid(10); // e.g. "aB3kL9mNpQ"
        
        // Add a 4-second timeout to prevent waiting too long on Firestore
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firestore timeout')), 4000)
        );

        await Promise.race([
          setDoc(doc(db, 'sharedReviews', shareId), {
            prData: prDataWithoutDiff,
            review,
            createdAt: serverTimestamp(),
            shareId,
          }),
          timeoutPromise
        ]);

        shareUrl = `${window.location.origin}/share/${shareId}`;
      } catch (dbErr) {
        console.warn('Firestore database write failed or timed out. Falling back to URL-compressed share link:', dbErr);
        // Compression fallback: encode the lightweight review payload into the link
        const compressed = await compressData({ prData: prDataWithoutDiff, review });
        shareUrl = `${window.location.origin}/share/${compressed}`;
      }

      await navigator.clipboard.writeText(shareUrl);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={status === 'loading'}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition
        ${status === 'copied'
          ? 'bg-emerald-900 border-emerald-700 text-emerald-300'
          : status === 'error'
          ? 'bg-red-950 border-red-800 text-red-300'
          : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
    >
      {status === 'loading' && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {status === 'idle' && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
      {status === 'copied' ? '✓ Link Copied!' : status === 'error' ? '⚠ Error' : status === 'loading' ? 'Generating...' : 'Share Review'}
    </button>
  );
}
