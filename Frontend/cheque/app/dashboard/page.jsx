"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function DashboardPage() {
  const router = useRouter();

  // --- 1. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("cheques"); 
  const [authorised, setAuthorised] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [chequeList, setChequeList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef(null);

  const chequePurposes = [
    "Salary Payment", "Rent Payment", "Vendor Payment",
    "Invoice Payment", "Loan Repayment", "Tuition Fee",
    "Utility Bill", "Insurance Premium", "Donation", "Personal Transfer"
  ];

  // --- 2. AUTH GUARD ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setAuthorised(true);
    }
  }, [router]);

  // --- 3. DATABASE FETCH (Async/Await) ---
  const fetchChequeData = async () => {
    const username = localStorage.getItem("username");
    if (!username) return;

    setLoading(true);
    try {
      // The 'await' is inside the 'async' function
      const response = await axios.get(`http://127.0.0.1:8000/cheque/list/${username}/`);
      
      if (response.data.status === "success") {
        setChequeList(response.data.cheques);
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

  // --- 4. UPLOAD LOGIC (Async/Await) ---
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
      // The 'await' is inside the 'async' function
      const response = await axios.post(`http://127.0.0.1:8000/cheque/cheque_reader/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if(response.data.status === "success"){
        alert("Cheque Digitalized Successfully");
        setShowUploadOptions(false);
        setActiveTab("cheques");
        await fetchChequeData(); // Refresh list after upload
      }
    } catch (error) {
      alert(error.response?.data?.message || "Upload failed. Check Server/CORS.");
    } finally {
      setLoading(false);
    }
  };

  if (!authorised) return null;

  return (
    <div className="p-4 md:p-8 text-black bg-gray-50 min-h-screen flex flex-col items-center font-sans">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-blue-900">Q-Cheque Dashboard</h1>

        {/* --- 5. TRANSITIONING BUTTONS --- */}
        <div className="relative flex bg-white p-1 rounded-xl shadow-inner border border-gray-200 mb-8 w-full max-w-md mx-auto">
          {/* Animated Sliding Background */}
          <div 
            className="absolute top-1 bottom-1 left-1 bg-blue-600 rounded-lg transition-all duration-500 ease-in-out z-0"
            style={{
              width: "calc(33.33% - 4px)",
              transform: `translateX(${showUploadOptions ? '100%' : activeTab === 'alerts' ? '200%' : '0%'})`
            }}
          />

          <button
            onClick={() => { setActiveTab("cheques"); setShowUploadOptions(false); }}
            className={`relative z-10 w-1/3 py-2 text-sm font-bold transition-colors duration-300 ${activeTab === 'cheques' && !showUploadOptions ? 'text-white' : 'text-gray-500'}`}
          >
            All Cheques
          </button>

          <button
            onClick={() => setShowUploadOptions(true)}
            className={`relative z-10 w-1/3 py-2 text-sm font-bold transition-colors duration-300 ${showUploadOptions ? 'text-white' : 'text-gray-500'}`}
          >
            + New Cheque
          </button>

          <button
            onClick={() => { setActiveTab("alerts"); setShowUploadOptions(false); }}
            className={`relative z-10 w-1/3 py-2 text-sm font-bold transition-colors duration-300 ${activeTab === 'alerts' && !showUploadOptions ? 'text-white' : 'text-gray-500'}`}
          >
            Alerts
          </button>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
          {showUploadOptions ? (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-bold text-gray-800">Upload New Cheque</h2>
               <select
                 value={purpose}
                 onChange={(e) => setPurpose(e.target.value)}
                 className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="">-- Select Purpose --</option>
                 {chequePurposes.map((p, i) => <option key={i} value={p}>{p}</option>)}
               </select>
               {purpose && (
                 <button 
                   disabled={loading}
                   onClick={() => inputRef.current.click()} 
                   className="w-full bg-green-600 p-4 rounded-xl text-white font-bold hover:bg-green-700 transition"
                 >
                   {loading ? "Processing AI..." : "📷 Capture Cheque"}
                 </button>
               )}
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {activeTab === "cheques" && <Cheques list={chequeList} loading={loading} />}
              {activeTab === "alerts" && <Alerts />}
            </div>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function Cheques({ list, loading }) {
  if (loading) return <div className="text-center py-20 text-gray-400 animate-pulse">Syncing with database...</div>;
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Recent Activity</h2>
      {list.length > 0 ? (
        <div className="overflow-hidden border border-gray-100 rounded-xl">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((item, index) => (
                <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 text-sm font-semibold text-gray-700">{item.description}</td>
                  <td className="p-4 text-sm text-center">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-20 text-gray-400">No cheques found.</p>
      )}
    </div>
  );
}

function Alerts() {
  return <div className="text-center py-20 text-gray-400">Post-dated cheque notifications will appear here.</div>;
}