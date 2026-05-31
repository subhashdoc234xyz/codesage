'use client';
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    setSuccess("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (db) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            name: user.displayName,
            photo: user.photoURL,
            createdAt: serverTimestamp(),
            uid: user.uid,
            provider: "google",
          });
        }
      }
      setSuccess("Success! Preparing your workspace...");
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign in cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup blocked. Please allow popups for this site.");
      } else {
        setError(err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!email || !password) return;
    if (loading || googleLoading) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Success! Preparing your workspace...");
      } else {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccess("Account successfully created! Logging you in...");
      }
    } catch (err) {
      // Clean up Firebase error messages to be user-friendly
      let cleanMessage = err.message;
      if (cleanMessage.includes("auth/invalid-credential") || cleanMessage.includes("auth/wrong-password") || cleanMessage.includes("auth/user-not-found")) {
        cleanMessage = "Invalid email or password. Please verify and try again.";
      } else if (cleanMessage.includes("auth/email-already-in-use")) {
        cleanMessage = "This email is already registered. Please sign in instead.";
      } else if (cleanMessage.includes("auth/invalid-email")) {
        cleanMessage = "Please enter a valid email address.";
      } else if (cleanMessage.includes("Firebase:")) {
        cleanMessage = cleanMessage.replace("Firebase: ", "").split("(")[0].trim();
      }
      setError(cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background Mesh (matched with home page) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-20">
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.04] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/3 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/[0.04] rounded-full blur-[140px]"></div>
      </div>

      {/* Premium Logo */}
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="w-11 h-11 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-emerald-500/10">
          <span className="text-lg font-extrabold tracking-tighter">CS</span>
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-none">
            CodeSage AI
          </h1>
          <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
            SMART PR REVIEWER
          </span>
        </div>
      </div>

      {/* Card (Glass Panel with internal ambient glows) */}
      <div className="w-full max-w-sm glass-panel rounded-2xl p-8 relative overflow-hidden animate-fade-in shadow-2xl">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/[0.03] rounded-full blur-[60px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/[0.03] rounded-full blur-[60px] pointer-events-none"></div>

        {/* Toggle between Sign In & Sign Up */}
        <div className="flex gap-1 bg-slate-950/80 border border-white/5 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${
              isLogin
                ? "bg-slate-900 border border-white/10 text-emerald-400 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${
              !isLogin
                ? "bg-slate-900 border border-white/10 text-emerald-400 shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Dynamic Titles */}
        <h2 className="text-white text-xl font-bold mb-1 tracking-tight">
          {isLogin ? "Welcome back" : "Create account"}
        </h2>
        <p className="text-gray-400 text-xs mb-6 leading-relaxed">
          {isLogin
            ? "Sign in to access your AI-powered reviews."
            : "Review pull requests like a 10+ year veteran engineer."}
        </p>

        {/* Alerts */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/20 border border-rose-800/40 rounded-xl text-rose-300 text-xs flex gap-2 animate-fade-in items-start">
            <span className="text-sm leading-none mt-0.5">⚠️</span>
            <span className="leading-normal font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-300 text-xs flex gap-2 animate-fade-in items-start">
            <span className="text-sm leading-none mt-0.5">✅</span>
            <span className="leading-normal font-medium">{success}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="w-full py-3 mb-5 rounded-xl border border-white/5 bg-slate-950/60 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {googleLoading ? (
            <svg className="animate-spin h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {googleLoading
            ? "Signing in..."
            : isLogin
            ? "Continue with Google"
            : "Sign up with Google"}
        </button>

        {/* Separator */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-[1px] bg-white/5"></div>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest pl-0.5">or email</span>
          <div className="flex-1 h-[1px] bg-white/5"></div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              required
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5 pl-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="••••••••"
              required
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
            />
            {!isLogin && (
              <p className="text-[10px] text-gray-500 mt-2 pl-1 font-mono">
                Min. 6 characters
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
            loading || !email || !password
              ? "bg-slate-900 border border-white/5 text-gray-600 cursor-not-allowed"
              : "bg-gradient-to-tr from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Authenticating...
            </span>
          ) : isLogin ? (
            "Sign In →"
          ) : (
            "Create Account →"
          )}
        </button>

        {/* Switch Link */}
        <p className="text-center text-xs text-gray-500 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }}
            className="text-emerald-400 hover:text-emerald-300 font-bold transition duration-200"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>

      <p className="text-gray-600 text-[10px] tracking-wide mt-6 font-medium">
        Powered by Firebase
      </p>
    </div>
  );
}

