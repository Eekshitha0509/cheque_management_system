"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

// Defined outside so all components can access it
const todayDate = new Date().toLocaleDateString('en-GB').replaceAll('/', '-');

export default function DashboardPage() {
  const router = useRouter();

  // --- 1. STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState("cheques");
  const [authorised, setAuthorised] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [chequeList, setChequeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null); 
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [alertList, setAlertList] = useState([]);

  const inputRef = useRef(null);

  const chequePurposes = [
    "Salary Payment", "Rent Payment", "Vendor Payment", "Invoice Payment",
    "Loan Repayment", "Tuition Fee", "Utility Bill", "Insurance Premium",
    "Donation", "Personal Transfer",
  ];

  // --- 2. DATABASE FETCH FUNCTIONS ---
  const fetchChequeData = useCallback(async () => {
    const username = localStorage.getItem("username");
    if (!username) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/cheque/list/${encodeURIComponent(username)}/`);
      if (response.data.status === "success") {
        setChequeList(response.data.cheques);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    const username = localStorage.getItem("username");
    if (!username) return;
    try {
      const response = await axios.get(`http://127.0.0.1:8000/cheque/alerts/${encodeURIComponent(username)}/`);
      if (response.data.status === "success") {
        setAlertList(response.data.alerts || []);
      }
    } catch (error) {
      console.error("Alert fetch error:", error);
    }
  }, []);

  // --- 3. AUTH & INITIAL LOAD ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setAuthorised(true);
      fetchChequeData();
      fetchAlerts();
    }
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage);
    };
  }, [router, fetchChequeData, fetchAlerts]);

  // Refresh data when tab switches
  useEffect(() => {
    if (authorised) {
      if (activeTab === "cheques") fetchChequeData();
      if (activeTab === "alerts") fetchAlerts();
    }
  }, [activeTab, authorised, fetchChequeData, fetchAlerts]);

  // --- 4. ACTIONS ---
  const handleUpdateChequeNumber = async (id, newNumber) => {
    try {
      const response = await axios.post(`http://127.0.0.1:8000/cheque/update_number/${id}/`, {
        cheque_no: newNumber
      });
      if (response.data.status === "success") {
        fetchChequeData();
        fetchAlerts();
      }
    } catch (err) {
      alert("Failed to update cheque number.");
    }
  };

  const handleToggleStatus = async (chequeId, currentStatus) => {
    const newStatus = currentStatus === 'CLEARED' ? 'PENDING' : 'CLEARED';
    const previousList = [...chequeList];

    setChequeList(prev => prev.map(item => 
      item.id === chequeId ? { ...item, status: newStatus } : item
    ));

    setUpdatingId(chequeId); 
    try {
      const response = await axios.post(`http://127.0.0.1:8000/cheque/clear/${chequeId}/`, {
        status: newStatus,
        username: localStorage.getItem("username")
      });
      
      if (response.data.status === "success") {
        await Promise.all([fetchChequeData(), fetchAlerts()]);
      } else {
        setChequeList(previousList);
      }
    } catch (error) {
      setChequeList(previousList);
    } finally {
      setUpdatingId(null); 
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (previewImage) URL.revokeObjectURL(previewImage);
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmitCheque = async () => {
    if (!selectedFile || !purpose) return;
    const username = localStorage.getItem("username");
    const formData = new FormData();
    formData.append("username", username);
    formData.append("cheque_image", selectedFile);
    formData.append("purpose", purpose);

    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/cheque/cheque_reader/", formData);
      if (response.data.status === "success") {
        resetUploadState();
        fetchChequeData();
        fetchAlerts();
      }
    } catch (err) {
      console.error(err);
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
    <div className="bg-white min-h-screen text-slate-800 font-sans">
      {/* FIXED HEADER & TABS CONTAINER */}
      <div className="sticky top-0 z-[100] bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 pt-12">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">My Ledger</h1>
              <p className="text-slate-500 mt-2">Manage your digital cheques and status updates.</p>
            </div>
            <button
              onClick={() => setShowUploadOptions(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-md active:scale-95 transition-all mb-1"
            >
              + New Entry
            </button>
          </div>

          <div className="flex gap-8">
            <button 
              onClick={() => {setActiveTab("cheques"); setShowUploadOptions(false)}} 
              className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === "cheques" && !showUploadOptions ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent"}`}
            >
              History
            </button>
            <button 
              onClick={() => {setActiveTab("alerts"); setShowUploadOptions(false)}} 
              className={`pb-4 text-sm font-bold transition-all border-b-2 ${activeTab === "alerts" ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent"}`}
            >
              Notifications ({alertList.length})
            </button>
          </div>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        {showUploadOptions ? (
          <div className="max-w-md bg-slate-50 p-8 rounded-3xl border border-slate-100 mx-auto shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-center">Digitalize Cheque</h2>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-white border mb-4">
              <option value="" disabled>-- Select Purpose --</option>
              {chequePurposes.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
            <button onClick={() => inputRef.current.click()} className="w-full mb-4 bg-slate-900 text-white p-4 rounded-2xl font-bold">Capture Image</button>
            {previewImage && <img src={previewImage} className="w-full rounded-xl mb-4 border" alt="preview" />}
            {selectedFile && <button onClick={handleSubmitCheque} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold transition-all active:scale-95">Submit Cheque</button>}
          </div>
        ) : (
          <div>
            {activeTab === "cheques" && (
                <Cheques 
                    list={chequeList} 
                    loading={loading} 
                    updatingId={updatingId} 
                    onToggle={handleToggleStatus}
                    onUpdateNumber={handleUpdateChequeNumber}
                />
            )}
            {activeTab === "alerts" && <Alerts list={alertList} loading={loading} />}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function StatusToggle({ status, onToggle, disabled }) {
  const isCleared = status === "CLEARED";
  return (
    <div className={`flex items-center justify-center gap-3 ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${isCleared ? "bg-emerald-500" : "bg-slate-200"}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${isCleared ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {isCleared ? "Reopen" : "Clear"}
      </span>
    </div>
  );
}

function Cheques({ list, loading, updatingId, onToggle, onUpdateNumber }) {
  if (loading && list.length === 0) return <div className="py-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Ledger...</div>;

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[13px] uppercase tracking-[0.15em] text-slate-900 bg-slate-50/50">
            <th className="p-5 font-bold border-b border-slate-500 min-w-[150px]">Date</th>
            <th className="p-5 font-bold border-b border-slate-500">Cheque No</th>
            <th className="p-5 font-bold border-b border-slate-500">Payee</th>
            <th className="p-5 font-bold border-b border-slate-500 text-center">Status</th>
            <th className="p-5 font-bold border-b border-slate-500 text-center">Action</th>
            <th className="p-5 font-bold border-b border-slate-500 text-right">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="p-5 text-sm text-slate-600">{item.date || "---"}</td>
              <td className="p-5">
                <EditableChequeNo 
                  initialValue={item.cheque_no} 
                  onSave={(newVal) => onUpdateNumber(item.id, newVal)} 
                />
              </td>
              <td className="p-5">
                <p className="font-bold text-slate-800">{item.payee}</p>
                <p className="text-[10px] text-slate-600 uppercase">{item.description}</p>
              </td>
              <td className="p-5 text-center">
                <span className={`text-[10px] font-black px-3 py-1 rounded-full border tracking-widest uppercase ${
                  item.status === 'CLEARED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                }`}>
                  {item.status}
                </span>
              </td>
              <td className="p-5 text-center">
                <StatusToggle status={item.status} onToggle={() => onToggle(item.id, item.status)} disabled={updatingId === item.id} />
              </td>
              <td className="p-5 text-right">
                {item.image && (
                  <a href={`http://127.0.0.1:8000${item.image}`} target="_blank" rel="noopener noreferrer">
                    <img src={`http://127.0.0.1:8000${item.image}`} className="w-10 h-7 object-cover rounded border border-slate-200 inline-block" alt="thumb" />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditableChequeNo({ initialValue, onSave }) {
  const [val, setVal] = useState(initialValue);
  return (
    <input 
      type="text" 
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { if (val !== initialValue) onSave(val); }}
      className="bg-slate-50 px-2 py-1 rounded font-mono text-sm border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none w-28 transition-all"
    />
  );
}

function Alerts({ list, loading }) {
  if (loading) return <div className="py-20 text-center animate-pulse text-xs font-bold text-slate-400">LOADING ALERTS...</div>;
  if (!list || list.length === 0) return <div className="py-20 text-center text-slate-400 font-medium">No active alerts.</div>;

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[13px] uppercase tracking-[0.15em] text-slate-900 bg-slate-50/50">
            <th className="p-5 font-bold border-b border-slate-900">Session Date</th>
            <th className="p-5 font-bold border-b border-slate-900">Cheque Date</th>
            <th className="p-5 font-bold border-b border-slate-900">Payee Name</th>
            <th className="p-5 font-bold border-b border-slate-900">Alert Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {list.map((item, index) => {
            const isDuplicate = item.alerts.toLowerCase().includes("duplicate");
            return (
              <tr key={index} className={isDuplicate ? "bg-red-50/50" : ""}>
                <td className="p-5 text-sm text-slate-500">{todayDate}</td>
                <td className="p-5 text-sm text-slate-500">{item.cheque_date || "N/A"}</td>
                <td className="p-5 font-bold text-slate-800">{item.payee_name || "Unknown"}</td>
                <td className="p-5">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    isDuplicate ? "bg-red-600 text-white" : "bg-red-50 text-red-600 border border-red-100"
                  }`}>
                    {item.alerts}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}