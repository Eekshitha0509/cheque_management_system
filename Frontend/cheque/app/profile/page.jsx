"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [newAmount, setNewAmount] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const user = localStorage.getItem("username");
    const res = await axios.get(`http://127.0.0.1:8000/account/profile/${user}/`);
    if (res.data.status === "success") setProfile(res.data.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async () => {
    const user = localStorage.getItem("username");
    const res = await axios.post(`http://127.0.0.1:8000/account/update-balance/${user}/`, {
      balance: newAmount
    });
    if (res.data.status === "success") {
      fetchData(); // Refresh UI
      setNewAmount("");
      alert("Wallet Updated!");
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400">Loading Wallet...</div>;

  return (
    <div className="bg-slate-50 min-h-screen p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* WALLET & TOP-UP SECTION */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* BALANCE CARD */}
          <div className="flex-1 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl border border-slate-800">
            <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em]">Verified Balance</p>
            <h2 className="text-5xl font-bold mt-6 tracking-tighter">₹{profile?.balance?.toLocaleString()}</h2>
            <div className="mt-12 flex items-center gap-3">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_green]"></div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">System Active</span>
            </div>
          </div>

          {/* UPDATE INPUT */}
          <div className="w-full md:w-80 bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm flex flex-col justify-center">
            <h3 className="font-bold text-slate-800 mb-6">Fund Account</h3>
            <input 
              type="number" 
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Enter Amount"
              className="w-full bg-slate-50 text-black border-2 rounded-2xl px-6 py-5 mb-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
            />
            <button 
              onClick={handleUpdate}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
            >
              Update Balance
            </button>
          </div>
        </div>

        {/* ACCOUNT CREDENTIALS TABLE */}
        <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-16">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Account Holder</p>
              <p className="text-xl font-bold text-slate-800 uppercase">{profile?.username}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Linked Bank</p>
              <p className="text-xl font-bold text-slate-800">{profile?.bank_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Primary Mobile</p>
              <p className="text-xl font-bold text-slate-800">+91 {profile?.mobile}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Verification</p>
              <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${profile?.is_verified ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {profile?.is_verified ? "● KYC Verified" : "○ Unverified"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}