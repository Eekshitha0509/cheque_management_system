"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState("login");
  const [loading, setLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const API_BASE = "http://127.0.0.1:8000/account";

  const AUTH_API = "http://127.0.0.1:8000/api/v1";

  /*useEffect(() => {
    const savedUser = localStorage.getItem("rememberedUsername");
    if (savedUser) { setUsername(savedUser); setRememberMe(true); }
  }, []);*/

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "login") {
        // 🛡️ JWT Login usually lives under /api/token/ or /api/v1/token/
        const res = await axios.post(`${AUTH_API}/token/`, { username, password });
        localStorage.setItem("token", res.data.access);
        router.push("/dashboard");
      } 
      else if (view === "forgot") {
        // 🛡️ Recovery logic lives in your 'account' app
        await axios.post(`${API_BASE}/request-otp/`, { email });
        setView("otp");
      } 
      else if (view === "otp") {
        const res = await axios.post(`${API_BASE}/verify-otp/`, { email, otp });
        setResetToken(res.data.reset_token);
        setView("reset");
      } 
      else if (view === "reset") {
        await axios.post(`${API_BASE}/reset-password/`, { reset_token: resetToken, new_password: newPassword });
        alert("Success! Password updated.");
        setView("login");
      }
    } catch (err) {
      console.error("API Error:", err.response);
      alert(err.response?.data?.error || err.response?.data?.detail || "Action failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* 🔹 Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />

      {/* 🔹 Brand Identity */}
      <div className="sticky top-[72px] z-[50] mb-10 text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4 transform hover:rotate-6 transition-transform">
          <span className="text-white text-2xl font-black italic">Q</span>
        </div>
        <h1 className="text-sm font-bold tracking-[0.3em] text-slate-400 uppercase">Q-Cheque Portal</h1>
      </div>

      {/* 🔹 Main Card */}
      <div className="w-full max-w-[400px] bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white p-10 z-10 transition-all">
        
        <header className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {view === "login" ? "Welcome back" : view === "forgot" ? "Reset Access" : view === "otp" ? "Verify Code" : "Final Step"}
          </h2>
          <p className="text-slate-500 text-sm mt-2">
            {view === "login" && "Please enter your details to continue."}
            {view === "forgot" && "Enter your email to receive a recovery code."}
            {view === "otp" && "We sent a 6-digit code to your inbox."}
            {view === "reset" && "Choose a strong new password."}
          </p>
        </header>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {view === "login" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-800" required />
                <div className="flex items-center justify-between pt-2 px-1">
                  <label className="flex items-center text-xs text-slate-500 cursor-pointer select-none">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="mr-2 w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setView("forgot")} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot Password?</button>
                </div>
              </div>
            </>
          )}

          {view === "forgot" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email</label>
              <input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border-transparent focus:bg-white focus:border-blue-500 transition-all outline-none" required />
            </div>
          )}

          {view === "otp" && (
            <div className="flex flex-col items-center">
              <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full text-center text-4xl font-mono font-black tracking-[0.3em] py-4 rounded-2xl bg-slate-100/50 border-2 border-dashed border-slate-200 focus:border-blue-500 focus:bg-white outline-none transition-all" required />
            </div>
          )}

          {view === "reset" && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-100/50 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all" required />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center">
            {loading ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : "Continue Action"}
          </button>
        </form>

        <footer className="mt-10 pt-6 border-t border-slate-100 text-center">
           {view === "login" ? (
             <p className="text-slate-500 text-sm">
               New to Q-Cheque? <Link href="/register" className="text-blue-600 font-extrabold hover:underline ml-1">Create Account</Link>
             </p>
           ) : (
             <button onClick={() => setView("login")} className="text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors flex items-center justify-center w-full">
               ← Back to Login
             </button>
           )}
        </footer>
      </div>
    </div>
  );
}