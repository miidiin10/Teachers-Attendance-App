"use client";
import { useEffect, useState } from "react";

export default function RecordsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/records")
      .then((r) => r.json())
      .then(setData);
  }, []);

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
