import { useState } from "react";
import PropTypes from "prop-types";
import Image from "next/image";

// SUB-COMPONENT: Handles the inline editing logic
function EditableChequeNo({ initialValue, onSave }) {
  const [val, setVal] = useState(initialValue || "");

  const handleBlur = () => {
    if (val.trim() && val !== initialValue) {
      onSave(val);
    }
  };

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={handleBlur}
      className="bg-slate-50 px-2 py-1 rounded font-mono text-sm border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none w-28 transition-all"
    />
  );
}

// MAIN COMPONENT: The Ledger Table
export default function Cheques({
  list,
  loading,
  updatingId,
  onToggle,
  onUpdateNumber,
}) {
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
            <th className="p-5 font-bold border-b border-slate-200">
              Cheque No
            </th>
            <th className="p-5 font-bold border-b border-slate-200">Payee</th>
            <th className="p-5 font-bold border-b border-slate-200 text-center">
              Status
            </th>
            <th className="p-5 font-bold border-b border-slate-200 text-center">
              Action
            </th>
            <th className="p-5 font-bold border-b border-slate-200 text-right">
              Reference
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {list.map((item) => {
            // cleaner button text logic
            let buttonText = "...";
            if (updatingId !== item.id) {
              buttonText =
                item.status === "CLEARED" ? "Reopen" : "Clear";
            }

            return (
              <tr
                key={item.id}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <td className="p-5 text-sm text-slate-600">
                  {item.date || "---"}
                </td>

                <td className="p-5">
                  <EditableChequeNo
                    initialValue={item.cheque_no}
                    onSave={(newVal) =>
                      onUpdateNumber(item.id, newVal)
                    }
                  />
                </td>

                <td className="p-5">
                  <p className="font-bold text-slate-800">
                    {item.payee}
                  </p>
                  <p className="text-[10px] text-slate-600 uppercase">
                    {item.description}
                  </p>
                </td>

                <td className="p-5 text-center">
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-full border tracking-widest uppercase ${
                      item.status === "CLEARED"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td className="p-5 text-center">
                  <button
                    onClick={() =>
                      onToggle(item.id, item.status)
                    }
                    disabled={updatingId === item.id}
                    className={`w-20 py-2 rounded-lg font-semibold text-white transition-all ${
                      item.status === "CLEARED"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    } ${
                      updatingId === item.id ? "opacity-50" : ""
                    }`}
                  >
                    {buttonText}
                  </button>
                </td>

                <td className="p-5 text-right">
                  {item.image && (
                    <a
                      href={item.image}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={item.image}
                        width={40}
                        height={28}
                        className="rounded border border-slate-200 inline-block"
                        alt="thumb"
                      />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


EditableChequeNo.propTypes = {
  initialValue: PropTypes.string,
  onSave: PropTypes.func,
};

Cheques.propTypes = {
  list: PropTypes.array,
  loading: PropTypes.bool,
  updatingId: PropTypes.number,
  onToggle: PropTypes.func,
  onUpdateNumber: PropTypes.func,
};