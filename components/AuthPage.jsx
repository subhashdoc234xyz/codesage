'use client';
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
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
