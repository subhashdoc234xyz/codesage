import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

// Save a review and return a share ID
export async function POST(request) {
  try {
    const { prData, review } = await request.json();
    const shareId = nanoid(10); // e.g. "aB3kL9mNpQ"

    await setDoc(doc(db, 'sharedReviews', shareId), {
      prData,
      review,
      createdAt: serverTimestamp(),
      shareId,
    });

    return NextResponse.json({ shareId });
  } catch (err) {
    console.error('Share error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get a shared review by ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id');
    if (!shareId) return NextResponse.json({ error: 'No share ID' }, { status: 400 });

    const docSnap = await getDoc(doc(db, 'sharedReviews', shareId));
    if (!docSnap.exists()) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

    return NextResponse.json(docSnap.data());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
