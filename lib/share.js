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

export async function generateShareUrl(prData, review) {
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

  return shareUrl;
}
