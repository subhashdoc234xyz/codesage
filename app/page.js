'use client';
import { useState, useEffect } from 'react';
import PRInput from '@/components/PRInput';
import DiffInput from '@/components/DiffInput';
import ReviewOutput from '@/components/ReviewOutput';
import DiffViewer from '@/components/DiffViewer';
import ShareButton from '@/components/ShareButton';
import ExportPDFButton from '@/components/ExportPDFButton';
import { sendReviewEmail } from '@/lib/emailjs';


// Firebase imports for auth protection
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AuthPage from '@/components/AuthPage';

export default function Home() {
  // Authentication states
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('review');
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'diff'
  const [emailSent, setEmailSent] = useState(false);

  const loadingSteps = [
    'Initializing CodeSage coordinator...',
    'Fetching Pull Request metadata from GitHub API...',
    'Downloading raw diff nodes and analyzing modifications...',
    'Running cognitive code review via Google Gemini 2.5 Flash...',
    'Parsing structured findings, scoring, and formatting...'
  ];

  // Firebase auth state subscription
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Rotate loading steps while compiling data for active feedback feel
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

  // Auth Protection Guard Renderings
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-900"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-cyan-500 animate-spin"></div>
        </div>
        <p className="text-gray-400 text-xs font-mono font-medium tracking-wide">
          Syncing CodeSage authorization...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  async function handleReview(prUrl) {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review process failed. Verify credentials.');
      setResult(data);
      if (data?.review && user?.email) {
        sendReviewEmail({
          toEmail: user.email,
          prTitle: data.prData.title,
          review: data.review,
        }).then(() => {
          setEmailSent(true);
          setTimeout(() => setEmailSent(false), 4000);
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRawDiffReview(diff) {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    try {
      const res = await fetch('/api/review-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diff }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');
      setResult(data);
      if (data?.review && user?.email) {
        sendReviewEmail({
          toEmail: user.email,
          prTitle: 'Raw Diff Review',
          review: data.review,
        }).then(() => {
          setEmailSent(true);
          setTimeout(() => setEmailSent(false), 4000);
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Dynamic Background Mesh (CSS Radial Orbs) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[140px]"></div>
      </div>

      {/* Sleek Navigation Bar */}
      <header className="glass-panel border-b border-white/5 sticky top-0 z-40 backdrop-blur-md px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition-transform duration-300 group-hover:scale-105">
            <span className="text-base font-extrabold tracking-tighter">CS</span>
          </div>
          <div>
            <h1 className="text-md font-bold text-white tracking-tight leading-none group-hover:text-emerald-400 transition-colors duration-200">
              CodeSage AI
            </h1>
            <span className="text-[10px] text-gray-400 font-medium tracking-wide">
              SMART PR REVIEWER
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-gray-500 bg-slate-900 px-2.5 py-1 rounded-md border border-white/5 tracking-wider">
              Powered by Gemini 2.5 Flash
            </span>
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              <span>PAT Guide</span>
              <span>↗</span>
            </a>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <span className="text-xs text-gray-400 font-mono hidden md:inline-block max-w-[150px] truncate" title={user?.email}>
              {user?.email}
            </span>
            <button
              onClick={() => signOut(auth)}
              className="text-[10px] font-bold uppercase text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg transition-all duration-300 active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Body Container */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-12">
        {/* Dynamic Hero Title Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
            AI-powered code review
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-none">
            Review Pull Requests like a{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-text-shine">
              Senior Engineer
            </span>
          </h2>
        </div>

        {/* PR URL Submission Section */}
        <div className="mb-8">
          {/* Input Mode Toggle */}
          <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-4 w-fit">
            <button
              onClick={() => setInputMode('url')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                inputMode === 'url'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🔗 GitHub PR URL
            </button>
            <button
              onClick={() => setInputMode('diff')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                inputMode === 'diff'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📋 Paste Raw Diff
            </button>
          </div>

          {/* Input Components */}
          {inputMode === 'url' && (
            <PRInput onReview={handleReview} loading={loading} />
          )}
          {inputMode === 'diff' && (
            <DiffInput onReview={handleRawDiffReview} loading={loading} />
          )}
        </div>

        {/* Dynamic Multi-Stage Loader */}
        {loading && (
          <div className="glass-panel border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 animate-pulse-slow">
            {/* Spinning Neon Wheel */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-900"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-cyan-500 animate-spin"></div>
            </div>
            
            {/* Loading stage lists */}
            <div className="text-center space-y-2">
              <h4 className="text-white text-base font-bold">Review in Progress</h4>
              <p className="text-emerald-400 text-xs font-mono font-medium tracking-wide">
                ⚡ {loadingSteps[loadingStep]}
              </p>
            </div>
            
            {/* Horizontal progress steps tracker */}
            <div className="w-full max-w-md flex justify-between gap-1 mt-2">
              {loadingSteps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    idx <= loadingStep ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error Cards */}
        {error && (
          <div className="p-5 bg-rose-950/20 border border-rose-800/40 rounded-2xl text-rose-300 text-sm flex gap-3 relative overflow-hidden animate-fade-in">
            <span className="text-lg">⚠️</span>
            <div className="space-y-1">
              <h5 className="font-bold text-rose-200">Review Coordination Error</h5>
              <p className="opacity-90">{error}</p>
              <div className="pt-2 text-xs text-rose-400 font-medium">
                💡 Hint: Make sure your <code>GEMINI_API_KEY</code> in <code>.env.local</code> is valid. For private repositories, verify your GITHUB_TOKEN has access permissions.
              </div>
            </div>
          </div>
        )}

        {/* Email Sent Toast Notification */}
        {emailSent && (
          <div className="mt-4 flex items-center gap-2 text-emerald-300 text-sm bg-emerald-950 border border-emerald-800 rounded-xl px-4 py-3 animate-fade-in">
            <span>✅</span>
            <span>Review summary sent to <strong>{user?.email}</strong></span>
          </div>
        )}

        {/* Successful Review Results Block */}
        {result && (
          <div className="space-y-8 animate-fade-in">
            {/* PR Info Header Panel */}
            <div className="glass-panel border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-5 items-center justify-between">
              {/* Left Column: Title and Branches */}
              <div className="space-y-2.5 text-center md:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 bg-slate-950 px-2 py-0.5 rounded border border-white/5 tracking-wider">
                    TARGET REPO
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-400 flex items-center gap-1">
                    <code>{result.prData.baseBranch}</code>
                    <span className="text-[10px] text-gray-600">←</span>
                    <code className="text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/30">
                      {result.prData.headBranch}
                    </code>
                  </span>
                </div>
                <h3 className="font-extrabold text-lg md:text-xl text-white tracking-tight truncate max-w-full" title={result.prData.title}>
                  {result.prData.title}
                </h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    {result.prData.authorAvatar ? (
                      <img 
                        src={result.prData.authorAvatar} 
                        alt={result.prData.author}
                        className="w-4 h-4 rounded-full border border-white/10" 
                      />
                    ) : (
                      <span>👤</span>
                    )}
                    <span className="font-semibold text-gray-300">{result.prData.author}</span>
                  </span>
                  <span>📁 {result.prData.changedFiles} files changed</span>
                  <span className="text-emerald-400 font-mono">+{result.prData.additions}</span>
                  <span className="text-rose-400 font-mono">-{result.prData.deletions}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons — Share and Export */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <ShareButton prData={result.prData} review={result.review} />
              <ExportPDFButton prData={result.prData} review={result.review} />
            </div>

            {/* Visual Tab Selection Row */}
            <div className="flex border-b border-white/5 gap-2">
              <button
                onClick={() => setActiveTab('review')}
                className={`pb-3 px-4 text-sm font-semibold relative transition-all ${
                  activeTab === 'review' 
                    ? 'text-emerald-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>🔍 AI Review Report</span>
                {activeTab === 'review' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('diff')}
                className={`pb-3 px-4 text-sm font-semibold relative transition-all ${
                  activeTab === 'diff' 
                    ? 'text-emerald-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>📄 Monaco Diff Viewer</span>
                {activeTab === 'diff' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Tab view containers */}
            <div className="transition-all duration-300">
              {activeTab === 'review' && <ReviewOutput review={result.review} />}
              {activeTab === 'diff' && <DiffViewer diff={result.prData.diff} />}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
