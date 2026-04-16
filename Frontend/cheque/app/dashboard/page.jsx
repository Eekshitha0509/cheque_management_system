"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

import Cheques from "@/components/Cheques";
import Alerts from "@/components/Alerts";
import ProcessingOverlay from "@/components/ProcessingOverlay";

export default function DashboardPage() {
  const router = useRouter();
  const inputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("cheques");
  const [authorised, setAuthorised] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [chequeList, setChequeList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // Fix: Separate loading state
  const [updatingId, setUpdatingId] = useState(null); 
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [alertList, setAlertList] = useState([]);

  const chequePurposes = [
    "Salary Payment", "Rent Payment", "Vendor Payment", "Invoice Payment",
    "Loan Repayment", "Tuition Fee", "Utility Bill", "Insurance Premium",
    "Donation", "Personal Transfer",
  ];

  const fetchChequeData = useCallback(async () => {
    const username = localStorage.getItem("username");
    if (!username) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://192.168.29.208:8000/cheque/list/${encodeURIComponent(username)}/`);
      if (response.data.status === "success") setChequeList(response.data.cheques);
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
      const response = await axios.get(`http://192.168.29.208:8000/cheque/alerts/${encodeURIComponent(username)}/`);
      if (response.data.status === "success") setAlertList(response.data.alerts || []);
    } catch (error) {
      console.error("Alert fetch error:", error);
    }
  }, []);


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setAuthorised(true);
      fetchChequeData();
      fetchAlerts();
    } else {
      router.push("/login");
    }
    return () => { if (previewImage) URL.revokeObjectURL(previewImage); };
  }, [router, fetchChequeData, fetchAlerts, previewImage]);


  const handleUpdateChequeNumber = async (id, newNumber) => {
    try {
      const response = await axios.post(`http://192.168.29.208:8000/cheque/update_number/${id}/`, { cheque_no: newNumber });
      if (response.data.status === "success") { fetchChequeData(); fetchAlerts(); }
    } catch (err) { alert("Failed to update cheque number."); }
  };

  const handleToggleStatus = async (chequeId, currentStatus) => {
  const newStatus = currentStatus === 'CLEARED' ? 'PENDING' : 'CLEARED';
  
  // Set the ID being updated to show the loading "..." state
  setUpdatingId(chequeId); 

  try {
    const response = await axios.post(`http://192.168.29.208:8000/cheque/clear/${chequeId}/`, {
      status: newStatus,
      username: localStorage.getItem("username")
    });
    
    if (response.data.status === "success") {
      // ONLY fetch data once the server has confirmed the change
      await Promise.all([fetchChequeData(), fetchAlerts()]);
    }
  } catch (error) {
    console.error("Update failed:", error);
    alert("Could not update status. Please check your connection.");
  } finally {
    
    setUpdatingId(null); 
  }
};

  const handleSubmitCheque = async () => {
    if (!selectedFile || !purpose) return;
    const formData = new FormData();
    formData.append("username", localStorage.getItem("username"));
    formData.append("cheque_image", selectedFile);
    formData.append("purpose", purpose);
    
    setIsAnalyzing(true); // Trigger overlay ONLY on submit click
    try {
      const response = await axios.post("http://192.168.29.208:8000/cheque/cheque_reader/", formData);
      if (response.data.status === "success") resetUploadState();
    } catch (err) { alert("AI Analysis failed. Please try again."); } finally { setIsAnalyzing(false); }
  };

  const resetUploadState = () => {
    setPurpose("");
    if (previewImage) URL.revokeObjectURL(previewImage);
    setPreviewImage(null); setSelectedFile(null);
    setShowUploadOptions(false); setActiveTab("cheques");
  };

  if (!authorised) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER SECTION */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-4">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">My Ledger</h1>
              <p className="text-slate-500 mt-2">Manage digital cheques and status updates.</p>
            </div>
            {/* RIGHT SIDE BUTTON */}
<button
  onClick={() => {
    setShowUploadOptions(true);
    setActiveTab(null); // Deselect tabs to show we are in "New Entry" mode
  }}
  className="
    ml-auto sm:ml-0
    bg-blue-600 hover:bg-blue-700 text-white 
    w-10 h-10 sm:w-auto sm:h-auto 
    flex items-center justify-center 
    rounded-full font-bold shadow-lg active:scale-95 transition-all
  "
>
  {/* Mobile View (+) */}
  <span className="block sm:hidden text-2xl">+</span>

  {/* Desktop View (+ New Entry) */}
  <span className="hidden sm:block px-8 py-3">
    + New Entry
  </span>
</button>
          </div>
          <div className="flex gap-8 mt-8">
            <button onClick={() => {setActiveTab("cheques"); setShowUploadOptions(false)}} className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === "cheques" && !showUploadOptions ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent"}`}>History</button>
            <button onClick={() => {setActiveTab("alerts"); setShowUploadOptions(false)}} className={`pb-4 text-sm font-bold border-b-2 transition-all ${activeTab === "alerts" ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent"}`}>Notifications ({alertList.length})</button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT Area */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        {showUploadOptions ? (
          <div className="max-w-md bg-slate-50 p-8 rounded-3xl border border-slate-100 mx-auto">
            <h2 className="text-xl font-bold mb-6 text-center">Digitalize Cheque</h2>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-white border mb-4">
              <option value="" disabled>-- Select Purpose --</option>
              {chequePurposes.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>
            <button onClick={() => inputRef.current.click()} className="w-full mb-4 bg-slate-900 text-white p-4 rounded-2xl font-bold">Capture Image</button>
            {previewImage && <img src={previewImage} className="w-full rounded-xl mb-4 border" alt="preview" />}
            {selectedFile && <button onClick={handleSubmitCheque} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold active:scale-95 transition-all">Submit Cheque</button>}
          </div>
        ) : (
          <div className="relative">
            {activeTab === "cheques" && <Cheques list={chequeList} loading={loading} updatingId={updatingId} onToggle={handleToggleStatus} onUpdateNumber={handleUpdateChequeNumber} />}
            {activeTab === "alerts" && <Alerts list={alertList} loading={loading} />}
          </div>
        )}
      </div>

      <ProcessingOverlay isVisible={isAnalyzing} />
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
        const file = e.target.files[0];
        if (file) { setSelectedFile(file); setPreviewImage(URL.createObjectURL(file)); }
      }} />
    </div>
  );
}