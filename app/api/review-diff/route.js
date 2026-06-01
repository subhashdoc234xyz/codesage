import { NextResponse } from 'next/server';
import { reviewPRWithGemini } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { diff } = await request.json();
    if (!diff) return NextResponse.json({ error: 'Diff is required' }, { status: 400 });

    // Build a fake prData object so reviewPRWithGemini works the same way
    const prData = {
      title: 'Raw Diff Review',
      description: 'User pasted a raw git diff for review',
      author: 'local',
      baseBranch: 'main',
      headBranch: 'feature',
      changedFiles: '?',
      additions: diff.split('\n').filter(l => l.startsWith('+')).length,
      deletions: diff.split('\n').filter(l => l.startsWith('-')).length,
      diff,
      files: [],
    };

    const review = await reviewPRWithGemini(prData);
    return NextResponse.json({ prData, review });
  } catch (error) {
    console.error('Diff review error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
