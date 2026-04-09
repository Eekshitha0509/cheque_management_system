// components/Alerts.jsx

// Use "export default" so page.jsx can find it easily
export default function Alerts({ list, loading }) {
  if (loading) return <div className="py-20 text-center animate-pulse text-xs font-bold text-slate-400">LOADING ALERTS...</div>;
  if (!list || list.length === 0) return <div className="py-20 text-center text-slate-400 font-medium">No active alerts.</div>;

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[13px] uppercase tracking-[0.15em] text-slate-900 bg-slate-50/50 sticky top-0 z-10">
            <th className="p-5 font-bold border-b border-slate-900">Cheque Date</th>
            <th className="p-5 font-bold border-b border-slate-900">Payee Name</th>
            <th className="p-5 font-bold border-b border-slate-900">Alert Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {list.map((item, index) => (
            <tr key={index} className={item.alerts.toLowerCase().includes("duplicate") ? "bg-red-50/50" : ""}>
              <td className="p-5 text-sm text-slate-500">{item.cheque_date || "N/A"}</td>
              <td className="p-5 font-bold text-slate-800">{item.payee_name || "Unknown"}</td>
              <td className="p-5">
                <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                  {item.alerts}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}