import { NextResponse } from 'next/server';
import { fetchPRData } from '@/lib/github';
import { reviewPRWithGemini } from '@/lib/gemini';

export async function POST(request) {
  try {
    // 1. Verify credentials beforehand
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Gemini API key is not configured. Please set the GEMINI_API_KEY variable in your .env.local file.',
          code: 'MISSING_GEMINI_KEY'
        }, 
        { status: 500 }
      );
    }

    const { prUrl } = await request.json();

    if (!prUrl) {
      return NextResponse.json(
        { error: 'GitHub Pull Request URL is required' }, 
        { status: 400 }
      );
    }

    // 2. Fetch PR metadata & git diff
    let prData;
    try {
      prData = await fetchPRData(prUrl);
    } catch (githubErr) {
      console.error('GitHub API error:', githubErr);
      return NextResponse.json(
        { 
          error: `GitHub Integration Error: ${githubErr.message}`,
          code: 'GITHUB_ERROR'
        },
        { status: 400 }
      );
    }

    // 3. Coordinate Gemini AI review
    let review;
    try {
      review = await reviewPRWithGemini(prData);
    } catch (geminiErr) {
      console.error('Gemini AI error:', geminiErr);
      return NextResponse.json(
        { 
          error: `AI Review Error: ${geminiErr.message}`,
          code: 'GEMINI_ERROR' 
        },
        { status: 502 }
      );
    }

    // 4. Return combined dataset
    return NextResponse.json({ prData, review });

  } catch (error) {
    console.error('Unexpected review coordination error:', error);
    return NextResponse.json(
      { error: `Internal server coordinator error: ${error.message}` }, 
      { status: 500 }
    );
  }
}
