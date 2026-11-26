"use client";
import { useEffect, useState } from "react";

export default function RecordsPage() {
  const [data, setData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timestamp = new Date().getTime();
    fetch(`/api/records?t=${timestamp}`, { 
      cache: "no-store",
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then((r) => r.json())
      .then((d) => {
        console.log("Records API response:", d); // 👈 Add this for debugging
        setData(d);
      })
      .catch(err => console.error("Fetch error:", err));
  }, [refreshKey]);

  if (!data) {
    return (
      <main className="pt-10">
        <p className="text-center text-sm text-slate-400">Loading...</p>
      </main>
    );
  }

  const days = Array.from({ length: data.daysInMonth }, (_, i) => i + 1);
  const monthLabel = new Date(`${data.month}-01T00:00:00`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="pt-10 space-y-4 pb-10">
      <h1 className="text-xl font-bold text-center">Daily Record</h1>
      <p className="text-center text-sm text-slate-500">{monthLabel}</p>
      
      {/* 👇 Add this button to manually refresh */}
      <div className="text-center">
        <button 
          onClick={() => setRefreshKey(k => k + 1)}
          className="text-xs bg-slate-200 px-3 py-1 rounded-full hover:bg-slate-300"
        >
          🔄 Refresh data
        </button>
      </div>

      {data.teachers.length === 0 ? (
        <p className="text-center text-sm text-slate-400 pt-4">No teachers added yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-white text-left font-medium text-slate-600 p-2 border-b border-r border-slate-100 whitespace-nowrap">
                  Teacher
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className="font-medium text-slate-500 p-2 border-b border-slate-100 text-center min-w-[46px]"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.teachers.map((t) => (
                <tr key={t.id}>
                  <td className="sticky left-0 bg-white font-medium text-slate-700 p-2 border-r border-b border-slate-50 whitespace-nowrap">
                    {t.name}
                  </td>
                  {days.map((d) => {
                    const time = data.records[t.id]?.[d];
                    return (
                      <td
                        key={d}
                        className={`p-2 border-b border-slate-50 text-center whitespace-nowrap ${
                          time ? "text-slate-700" : "text-slate-300"
                        }`}
                      >
                        {time ? time.slice(0, 5) : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Scroll sideways to see every day. Automatically starts fresh each new month -
        past months stay on record, just not shown here by default.
      </p>
    </main>
  );
}
