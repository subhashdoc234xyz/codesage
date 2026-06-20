'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Google Sign In ──
  async function handleGoogle() {
    setGoogleLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.displayName,
          photo: user.photoURL,
          createdAt: serverTimestamp(),
          uid: user.uid,
          provider: 'google',
        });
      }
      router.push('/');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') setError('Sign in cancelled. Please try again.');
      else if (err.code === 'auth/popup-blocked') setError('Popup blocked. Please allow popups for this site.');
      else setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── GitHub Sign In ──
  async function handleGithub() {
    setGithubLoading(true);
    setError('');
    try {
      const provider = new GithubAuthProvider();
      provider.addScope('repo');
      provider.addScope('user:email');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const credential = GithubAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      let primaryEmail = user.email;

      if (accessToken) {
        try {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `token ${accessToken}` },
          });
          const emails = await res.json();
          if (Array.isArray(emails)) {
            const emailObj = emails.find(e => e.primary && e.verified);
            if (emailObj) {
              primaryEmail = emailObj.email;
            }
          }
        } catch (e) {
          console.error("Error fetching email from GitHub:", e);
        }
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          email: primaryEmail,
          name: user.displayName,
          photo: user.photoURL,
          createdAt: serverTimestamp(),
          uid: user.uid,
          provider: 'github',
        });
      } else {
        await setDoc(doc(db, 'users', user.uid), { email: primaryEmail }, { merge: true });
      }
      router.push('/');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') setError('Sign in cancelled. Please try again.');
      else if (err.code === 'auth/popup-blocked') setError('Popup blocked. Please allow popups for this site.');
      else if (err.code === 'auth/account-exists-with-different-credential') setError('An account already exists with this email. Try signing in with Google or email.');
      else setError(err.message);
    } finally {
      setGithubLoading(false);
    }
  }

  // ── Email/Password ──
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email.toLowerCase(),
          createdAt: serverTimestamp(),
          uid: userCredential.user.uid,
          provider: 'email',
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email already registered. Sign in instead.');
      else if (err.code === 'auth/user-not-found') setError('No account found. Sign up instead.');
      else if (err.code === 'auth/wrong-password') setError('Wrong password. Try again.');
      else if (err.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else if (err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const anyLoading = loading || googleLoading || githubLoading;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-base">
          CS
        </div>
        <div>
          <p className="text-white text-xl font-bold leading-tight">CodeSage AI</p>
          <p className="text-gray-500 text-xs tracking-widest uppercase">Smart PR Reviewer</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">

        {/* Tab Toggle */}
        <div className="flex bg-gray-800 rounded-xl p-1 mb-8">
          <button
            onClick={() => { setMode('signin'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition ${
              mode === 'signin' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            SIGN IN
          </button>
          <button
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition ${
              mode === 'signup' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            SIGN UP
          </button>
        </div>

        {/* Title */}
        <h1 className="text-white text-2xl font-bold mb-1">
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {mode === 'signin'
            ? 'Sign in to access your AI-powered reviews.'
            : 'Start reviewing PRs like a senior engineer.'}
        </p>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-yellow-300 text-sm bg-yellow-950 border border-yellow-800 rounded-xl px-4 py-3 mb-5">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3 mb-4">

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={anyLoading}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-white py-3 rounded-xl text-sm font-medium transition"
          >
            {googleLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {googleLoading ? 'Signing in...' : mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
          </button>

          {/* GitHub Button */}
          <button
            onClick={handleGithub}
            disabled={anyLoading}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 text-white py-3 rounded-xl text-sm font-medium transition"
          >
            {githubLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            )}
            {githubLoading ? 'Signing in...' : mode === 'signin' ? 'Continue with GitHub' : 'Sign up with GitHub'}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="text-gray-500 text-xs">or continue with email</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block tracking-wide uppercase">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block tracking-wide uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'password'}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={anyLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-xl text-sm font-semibold tracking-wide transition"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signin'
              ? 'SIGN IN'
              : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-gray-500 text-sm mt-6">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>

      <p className="text-gray-600 text-xs mt-6">Powered by Gemini 2.5 Flash · Team xeno2</p>
    </div>
  );
}
