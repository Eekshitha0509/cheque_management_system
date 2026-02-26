"use client";

import { useState } from "react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"cheques" | "alerts">("cheques");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-black mb-6">
        Dashboard
      </h1>

      {/* 🔹 Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("cheques")}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === "cheques"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-black"
          }`}
        >
          All Cheques
        </button>

        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-6 py-2 rounded-lg font-medium ${
            activeTab === "alerts"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-black"
          }`}
        >
          Alerts
        </button>
      </div>

      {/* 🔹 Content */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        {activeTab === "cheques" && <AllCheques />}
        {activeTab === "alerts" && <Alerts />}
      </div>
    </div>
  );
}

/* 🔹 All Cheques Component */
function AllCheques() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Cheques</h2>
      <p className="text-gray-600">
        List of all issued and received cheques will appear here.
      </p>
    </div>
  );
}

/* 🔹 Alerts Component */
function Alerts() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Alerts</h2>
      <p className="text-gray-600">
        Cheque alerts and notifications will appear here.
      </p>
    </div>
  );
}