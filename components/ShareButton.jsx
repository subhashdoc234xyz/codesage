'use client';
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

export default function ShareButton({ prData, review }) {
  const [status, setStatus] = useState('idle'); // idle | loading | copied | error

  async function handleShare() {
    setStatus('loading');
    try {
      const shareId = nanoid(10); // e.g. "aB3kL9mNpQ"
      
      if (!db) {
        throw new Error('Database not initialized');
      }

      // Add a 6-second timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Share request timed out. Please check your Firebase Firestore database setup/rules.')), 6000)
      );

      await Promise.race([
        setDoc(doc(db, 'sharedReviews', shareId), {
          prData,
          review,
          createdAt: serverTimestamp(),
          shareId,
        }),
        timeoutPromise
      ]);

      const shareUrl = `${window.location.origin}/share/${shareId}`;
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
