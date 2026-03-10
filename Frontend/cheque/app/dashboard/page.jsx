"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("cheques");
  const [authorised, setAuthorised] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [chequeList, setChequeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const chequePurposes = [
    "Salary Payment", "Rent Payment", "Vendor Payment", "Invoice Payment",
    "Loan Repayment", "Tuition Fee", "Utility Bill", "Insurance Premium",
    "Donation", "Personal Transfer"
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login"); //
    } else {
      setAuthorised(true);
    }
  }, [router]);

  const fetchChequeData = async () => {
    const username = localStorage.getItem("username"); //
    if (!username) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/cheque/list/${encodeURIComponent(username)}/` //
      );
      if (response.data.status === "success") {
        setChequeList(response.data.cheques); //
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorised && activeTab === "cheques" && !showUploadOptions) {
      fetchChequeData();
    }
  }, [authorised, activeTab, showUploadOptions]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const username = localStorage.getItem("username");
    const formData = new FormData();
    formData.append("username", username);
    formData.append("cheque_image", file);
    formData.append("purpose", purpose);

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/cheque/cheque_reader/", formData); //
      if (response.data.status === "success") {
        setShowUploadOptions(false);
        setActiveTab("cheques");
        fetchChequeData();
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!authorised) return null;

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        {/* Simple Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-slate-900">My Ledger</h1>
            <p className="text-slate-500 mt-2">Track and manage your digital cheques.</p>
          </div>
          <button 
            onClick={() => setShowUploadOptions(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
          >
            + New Entry
          </button>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex gap-8 border-b border-slate-300 mb-8">
          <button 
            onClick={() => {setActiveTab("cheques"); setShowUploadOptions(false);}}
            className={`pb-4 text-sm font-bold transition-all ${activeTab === "cheques" && !showUploadOptions ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            History
          </button>
          <button 
            onClick={() => {setActiveTab("alerts"); setShowUploadOptions(false);}}
            className={`pb-4 text-sm font-bold transition-all ${activeTab === "alerts" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"}`}
          >
            Notifications
          </button>
        </div>

        {/* Content Wrapper */}
        <div className="transition-all duration-300">
          {showUploadOptions ? (
            <div className="max-w-md bg-slate-50 p-8 rounded-3xl border border-slate-100 animate-in fade-in zoom-in-95">
              <h2 className="text-xl font-bold mb-6">Select Purpose</h2>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none mb-6"
              >
                <option value="">-- Choose --</option>
                {chequePurposes.map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>
              {purpose && (
                <button
                  disabled={loading}
                  onClick={() => inputRef.current.click()}
                  className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold hover:opacity-90 transition"
                >
                  {loading ? "Processing..." : "Capture Image"}
                </button>
              )}
            </div>
          ) : (
            <div>
              {activeTab === "cheques" && <Cheques list={chequeList} loading={loading} />}
              {activeTab === "alerts" && <div className="py-20 text-center text-slate-400">No new alerts.</div>}
            </div>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function Cheques({ list, loading }) {
  if (loading) return <div className="py-20 text-center text-slate-300 animate-pulse">Syncing...</div>;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[15px] uppercase tracking-[0.2em] text-slate-600 font-black border-b border-slate-50">
            <th className="pb-4 font-bold">Date</th>
            <th className="pb-4 font-bold">Payee</th>
            <th className="pb-4 font-bold">Description</th>
            <th className="pb-4 font-bold text-center">Status</th>
            <th className="pb-4 font-bold text-right">View</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {list.length > 0 ? (
            list.map((item, index) => (
              <tr key={index} className="group transition-colors hover:bg-slate-150/50">
                <td className="py-6 text-md text-slate-500">{item.date}</td>
                <td className="py-6 font-bold text-slate-800">{item.payee}</td>
                <td className="py-6 text-md text-slate-500">{item.description}</td>
                <td className="py-6 text-center">
                  <span className="text-[15px] font-bold px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 uppercase">
                    {item.status}
                  </span>
                </td>
                <td className="py-6 text-right text">
                  {item.image && (
                    <a href={`http://127.0.0.1:8000${item.image}`} target="_blank" className="inline-block">
                      <img src={`http://127.0.0.1:8000${item.image}`} className="w-10 h-6 object-cover rounded shadow-sm border border-slate-100" alt="chq" />
                    </a>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="5" className="py-20 text-center text-slate-300">No data found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}