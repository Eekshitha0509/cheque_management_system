"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import API from "../../api";

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

  useEffect(() => {
    const savedUser = localStorage.getItem("rememberedUsername");
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  // ✅ FIXED: remove nested ternary
  let headingText = "Final Step";
  if (view === "login") {
    headingText = "Welcome back";
  } else if (view === "forgot") {
    headingText = "Reset Access";
  } else if (view === "otp") {
    headingText = "Verify Code";
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "login") {
        const res = await API.post(`/api/v1/token/`, { username, password });

        localStorage.setItem("token", res.data.access);
        localStorage.setItem("username", username);

        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username);
        } else {
          localStorage.removeItem("rememberedUsername");
        }

        alert("Login successful!");
        router.push("/dashboard");
      } 
      else if (view === "forgot") {
        await API.post(`/account/request-otp/`, { email });
        alert("OTP sent to your email");
        setView("otp");
      } 
      else if (view === "otp") {
        const res = await API.post(`/account/verify-otp/`, { email, otp });
        setResetToken(res.data.reset_token);
        alert("OTP verified!");
        setView("reset");
      } 
      else if (view === "reset") {
        await API.post(`/account/reset-password/`, {
          reset_token: resetToken,
          new_password: newPassword
        });
        alert("Password updated successfully!");
        setView("login");
      }
    } catch (err) {
      console.error("API Error:", err.response);

      alert(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Action failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />

      {/* Logo */}
      <div className="mb-10 text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-xl mb-4">
          <span className="text-white text-2xl font-black italic">Q</span>
        </div>
        <h1 className="text-sm font-bold tracking-[0.3em] text-slate-400 uppercase">
          Q-Cheque Portal
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-width: 400px; bg-white rounded-[2.5rem] shadow border p-10 z-10">

        {/* Header */}
        <header className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">
            {headingText}
          </h2>
        </header>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-6">

          {view === "login" && (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border"
                required
              />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 rounded-xl border"
                required
              />

              <div className="flex justify-between text-sm">
                <label className="flex items-center gap-2">
  
  <input
    type="checkbox"
    checked={rememberMe}
    onChange={(e) => setRememberMe(e.target.checked)}
  />
  {/* */}
  Remember me 
</label>

                <button type="button" onClick={() => setView("forgot")}>
                  Forgot?
                </button>
              </div>
            </>
          )}

          {view === "forgot" && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl border"
              required
            />
          )}

          {view === "otp" && (
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              className="w-full px-4 py-3 rounded-xl border text-center"
              required
            />
          )}

          {view === "reset" && (
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full px-4 py-3 rounded-xl border"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            {loading ? "Loading..." : "Submit"}
          </button>
        </form>

        {/* Footer */}
        <footer className="mt-6 text-center">
          {view === "login" ? (
            <Link href="/register">Create Account</Link>
          ) : (
            <button onClick={() => setView("login")}>
              Back to Login
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}