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
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [alertList, setAlertList] = useState([]);

  const inputRef = useRef(null);

  const chequePurposes = [
    "Salary Payment", "Rent Payment", "Vendor Payment", "Invoice Payment",
    "Loan Repayment", "Tuition Fee", "Utility Bill", "Insurance Premium",
    "Donation", "Personal Transfer",
  ];

  //--- 2. AUTH GUARD & INITIALIZATION ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setAuthorised(true);
    }
    
    // Cleanup function to prevent memory leaks from Object URLs
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [router, previewImage]);

  // --- 3. DATABASE FETCH ---
  const fetchChequeData = async () => {
    const username = localStorage.getItem("username");
    if (!username) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/cheque/list/${encodeURIComponent(username)}/`
      );
      if (response.data.status === "success") {
        setChequeList(response.data.cheques);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {

  const username = localStorage.getItem("username");

  if (!username) return;

  try {

    setLoading(true);

    const response = await axios.get(
      `http://127.0.0.1:8000/cheque/alerts/${encodeURIComponent(username)}/`
    );

    if (response.data.status === "success") {
      setAlertList(response.data.alerts);
    }

  } catch (error) {
    console.error("Alert fetch error:", error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {

  if (!authorised) return;

  if (activeTab === "cheques" && !showUploadOptions) {
    fetchChequeData();
  }

  if (activeTab === "alerts") {
    fetchAlerts();
  }

}, [authorised, activeTab, showUploadOptions]);

  // --- 4.Image Preview ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Revoke old URL
    if (previewImage) URL.revokeObjectURL(previewImage);

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmitCheque = async () => {
    if (!selectedFile || !purpose) {
      alert("Please select a purpose and capture an image");
      return;
    }

    const username = localStorage.getItem("username");
    const formData = new FormData();
    formData.append("username", username);
    formData.append("cheque_image", selectedFile);
    formData.append("purpose", purpose);

    setLoading(true);
    try {
          const response = await axios.post(
        "http://127.0.0.1:8000/cheque/cheque_reader/",
        formData
      );

      if (response.data.status === "success") {
        alert("Cheque submitted successfully");
        resetUploadState();
        fetchChequeData();
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetUploadState = () => {
    setPurpose("");
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setSelectedFile(null);
    setShowUploadOptions(false);
    setActiveTab("cheques");
  };

  if (!authorised) return null;

  return (
    <div className="bg-white min-h-screen text-slate-800 font-sans pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-light tracking-tight text-slate-900">My Ledger</h1>
            <p className="text-slate-500 mt-2">Track and manage your digital cheques.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setShowUploadOptions(true);
                setPurpose("");
                setPreviewImage(null);
                setSelectedFile(null);
              }}
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              + New Entry
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex gap-8 border-b border-slate-300 mb-8">
          <button
            onClick={() => { setActiveTab("cheques"); setShowUploadOptions(false); }}
            className={`pb-4 text-sm font-bold transition-all ${
              activeTab === "cheques" && !showUploadOptions ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            History
          </button>
          <button
            onClick={() => { setActiveTab("alerts"); setShowUploadOptions(false); }}
            className={`pb-4 text-sm font-bold transition-all ${
              activeTab === "alerts" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Notifications ({alertList.length})
          </button>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="transition-all duration-300">
          {showUploadOptions ? (
            <div className="max-w-md bg-slate-50 p-8 rounded-3xl border border-slate-100 mx-auto">
              <h2 className="text-xl font-bold mb-6 text-center">Digitalize Cheque</h2>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full p-4 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none mb-6 bg-white"
              >
                <option value="">-- Select Purpose --</option>
                {chequePurposes.map((p, i) => <option key={i} value={p}>{p}</option>)}
              </select>

              {purpose && (
                <button
                  onClick={() => inputRef.current.click()}
                  className="w-full bg-slate-900 text-white p-4 rounded-2xl font-bold hover:opacity-90 transition mb-4 shadow-lg"
                >
                  {previewImage ? "Retake Image" : "Capture Cheque Image"}
                </button>
              )}

              {previewImage && (
                <div className="relative group">
                  <img src={previewImage} className="w-full rounded-xl mb-4 border shadow-sm" alt="preview" />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">Preview</span>
                  </div>
                </div>
              )}

              {selectedFile && (
                <button
                  onClick={handleSubmitCheque}
                  className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                  Confirm & Submit
                </button>
              )}
            </div>
          ) : (
            <div>
              {activeTab === "cheques" && <Cheques list={chequeList} loading={loading} />}
              {activeTab === "alerts" && <Alerts list={alertList} loading={loading} />}
            </div>
          )}
        </div>
      </div>

      {/* HIDDEN FILE INPUT */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// --- SUB-COMPONENT: CHEQUES TABLE ---
function Cheques({ list, loading }) {
  if (loading) return (
    <div className="py-20 text-center text-slate-300 animate-pulse font-medium">
      Connecting to ledger...
    </div>
  );

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <th className="p-4 font-bold border-b">Date</th>
            <th className="p-4 font-bold border-b">Cheque Number</th>
            <th className="p-4 font-bold border-b">Payee</th>
            <th className="p-4 font-bold border-b">Description</th>
            <th className="p-4 font-bold text-center border-b">Status</th>
            <th className="p-4 font-bold text-right border-b">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {list.length > 0 ? (
            list.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-sm text-slate-500">{item.date || "N/A"}</td>
                <td className="p-4 text-sm text-slate-500">{item.cheque_no}</td>
                <td className="p-4 font-bold text-slate-800">{item.payee}</td>
                <td className="p-4 text-sm text-slate-500">{item.description}</td>
                <td className="p-4 text-center">
                  <span className="text-[12px] font-bold px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 uppercase">
                    {item.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {item.image ? (
                    <a href={`http://127.0.0.1:8000${item.image}`} target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform">
                      <img 
                        src={`http://127.0.0.1:8000${item.image}`} 
                        className="w-12 h-8 object-cover rounded shadow-sm border border-slate-200" 
                        alt="instrument" 
                      />
                    </a>
                  ) : <span className="text-slate-300 text-xs">No image</span>}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="py-20 text-center text-slate-400 font-medium">
                No transaction records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Alerts({list , loading}){
  if(loading) {return (
    <div className="py-20 text-center text-slate-300 animate-pulse font-medium">
       Fetching your latest alerts...
    </div>
  )}
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[13px] uppercase tracking-wider text-slate-500 bg-slate-50">
            <th className="p-4 font-bold border-b">Date</th>
            <th className="p-4 font-bold border-b">Cheque Date</th>
            <th className="p-4 font-bold border-b">Alerts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {list.length > 0 ? (
            list.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 text-sm text-slate-500">{item.date || "N/A"}</td>
                <td className="p-4 text-sm text-slate-500">{item.cheque_date}</td>
                <td className="p-4 font-bold text-slate-800">{item.alerts}</td>
                <td className="p-4 text-center">
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="py-20 text-center text-slate-400 font-medium">
                No transaction records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}