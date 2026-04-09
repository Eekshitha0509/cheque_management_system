import { useState } from "react";

// SUB-COMPONENT: Handles the inline editing logic
function EditableChequeNo({ initialValue, onSave }) {
  const [val, setVal] = useState(initialValue);

  return (
    <input 
      type="text" 
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => { 
        if (val !== initialValue) onSave(val); 
      }}
      className="bg-slate-50 px-2 py-1 rounded font-mono text-sm border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none w-28 transition-all"
    />
  );
}

// MAIN COMPONENT: The Ledger Table
export default function Cheques({ list, loading, updatingId, onToggle, onUpdateNumber }) {
  if (loading && list.length === 0) {
    return (
      <div className="py-20 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">
        Syncing Ledger...
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[13px] uppercase tracking-[0.15em] text-slate-900 bg-slate-50/50 sticky top-0 z-10">
            <th className="p-5 font-bold border-b border-slate-200">Date</th>
            <th className="p-5 font-bold border-b border-slate-200">Cheque No</th>
            <th className="p-5 font-bold border-b border-slate-200">Payee</th>
            <th className="p-5 font-bold border-b border-slate-200 text-center">Status</th>
            <th className="p-5 font-bold border-b border-slate-200 text-center">Action</th>
            <th className="p-5 font-bold border-b border-slate-200 text-right">Reference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="p-5 text-sm text-slate-600">{item.date || "---"}</td>
              <td className="p-5">
                {/* Use the editable component here */}
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
                <button 
                  onClick={() => onToggle(item.id, item.status)}
                  disabled={updatingId === item.id}
                  className={`w-[80px] py-2 rounded-lg font-semibold text-white transition-all ${
                    item.status === "CLEARED" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"
                  } ${updatingId === item.id ? "opacity-50" : ""}`}
                >
                  {updatingId === item.id ? "..." : item.status === "CLEARED" ? "Reopen" : "Clear"}
                </button>
              </td>
              <td className="p-5 text-right">
                {item.image && (
                  <a href={item.image} target="_blank" rel="noopener noreferrer">
                    <img src={item.image} className="w-10 h-7 object-cover rounded border border-slate-200 inline-block" alt="thumb" />
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