"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ total: 0, cleared: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const user = localStorage.getItem("username");
    try {
      const profileRes = await axios.get(`http://127.0.0.1:8000/account/profile/${user}/`);
      if (profileRes.data.status === "success") setProfile(profileRes.data.data);

      const statsRes = await axios.get(`http://127.0.0.1:8000/cheque/list/${user}/`);
      if (statsRes.data.status === "success") {
        const cheques = statsRes.data.cheques;
        setStats({
          total: cheques.length,
          cleared: cheques.filter(c => c.status === 'CLEARED').length,
          pending: cheques.filter(c => c.status === 'PENDING').length
        });
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-[#fcfcfc] min-h-screen p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* ENLARGED HEADER */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold uppercase tracking-[0.2em] text-blue-600">
            Account Overview
          </h2>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Welcome, {profile?.username || "User"}
          </h1>
        </div>

        {/* CENTERED HERO SECTION: BALANCE & DETAILS */}
        <div className="flex flex-col lg:flex-row justify-center items-stretch gap-8">
          
          {/* REFINED BALANCE CARD */}
          <div className="w-full lg:w-[450px] bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">Current Balance</p>
            <h2 className="text-6xl font-black mt-2 tracking-tighter">
              ₹{profile?.balance?.toLocaleString() || "0"}
            </h2>
            <div className="mt-8 flex items-center gap-3">
               <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)] animate-pulse"></div>
               <span className="text-slate-300 text-[11px] font-bold uppercase tracking-widest">System Verified</span>
            </div>
            {/* Visual Flare */}
            <div className="absolute -right-4 -top-4 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>
          </div>

          {/* COMPACT DETAILS CARD (Enhanced Icons) */}
          <div className="w-full lg:w-[350px] bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col justify-center space-y-8">
            <InfoBlock label="Profile Holder" value={profile?.username} icon="👤" />
            <InfoBlock label="Associated Bank" value={profile?.bank_name || "HDFC Bank"} icon="🏦" />
            <InfoBlock label="Contact Point" value={`+91 ${profile?.mobile || "---"}`} icon="📱" />
          </div>
        </div>

        {/* LOWER SECTION: CHEQUE METRICS */}
        <div className="max-w-4xl mx-auto space-y-8 pt-4">
          <div className="flex items-center gap-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">Status Ledger</h3>
            <div className="h-[2px] bg-slate-100 w-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Cheques" value={stats.total} />
            <StatCard label="Cleared Items" value={stats.cleared} isSuccess />
            <StatCard label="Pending Items" value={stats.pending} isWarning />
          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component for Statistics
function StatCard({ label, value, isSuccess, isWarning }) {
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:translate-y-[-4px] hover:shadow-lg">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-4xl font-black tracking-tighter ${isSuccess ? 'text-emerald-600' : isWarning ? 'text-amber-600' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  );
}

// Sub-component for Info Blocks with stronger icons
function InfoBlock({ label, value, icon }) {
  return (
    <div className="flex items-center gap-5 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner border border-slate-100">
        <span className="opacity-100">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-base font-black text-slate-800 truncate">{value || "---"}</p>
      </div>
    </div>
  );
}