"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("cheques");
  const [authorised, setAuthorised] = useState(false);
  const inputRef = useRef(null);

  const handleUploadClick = () => {
    inputRef.current.click();
  };
  // const token = localStorage.getItem("token");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    } 
    
  }, [router])
  
  // if (!authorised) return null; // or loader

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-black mb-6">Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("cheques")}
          className="bg-blue-600 px-6 py-2 rounded-md text-white font-medium"
        >
          All Cheques
        </button>

        <button
          onClick={handleUploadClick}
          className="bg-blue-600 px-4 py-2 rounded-md text-white font-medium"
        >
          + Upload New Cheque
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className="bg-blue-600 px-4 py-2 rounded-md text-white font-medium"
        >
          Alerts
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        {activeTab === "cheques" && <Cheques />}
        {activeTab === "alerts" && <Alerts />}
      </div>
    </div>
  );
}

function Cheques() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-black">All Cheques</h2>
      <p className="text-gray-600">
        List of all issued and received cheques will appear here.
      </p>
    </div>
  );
}

function Alerts() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-black">Alerts</h2>
      <p className="text-gray-600">
        Cheque alerts and notifications will appear here.
      </p>
    </div>
  );
}