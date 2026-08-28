"use client";
import { useEffect, useState } from "react";
import { fetchFresh } from "../../lib/fetchFresh";

export default function LeaderboardPage() {
  const [tab, setTab] = useState("daily");
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);

  useEffect(() => {
    fetchFresh("/api/leaderboard?type=daily").then((r) => r.json()).then(setDaily);
    fetchFresh("/api/leaderboard?type=monthly").then((r) => r.json()).then(setMonthly);
  }, []);

  return (
    <main className="pt-10 space-y-5">
      <h1 className="text-xl font-bold text-center">Leaderboard</h1>

      <div className="flex bg-slate-200 rounded-xl p-1">
        <button
          onClick={() => setTab("daily")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "daily" ? "bg-white shadow" : "text-slate-500"}`}
        >
          Today
        </button>
        <button
          onClick={() => setTab("monthly")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "monthly" ? "bg-white shadow" : "text-slate-500"}`}
        >
          This Month
        </button>
      </div>

      {tab === "daily" && (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {!daily && <p className="p-4 text-sm text-slate-400">Loading...</p>}
          {daily?.rows?.length === 0 && (
            <p className="p-4 text-sm text-slate-400">No check-ins yet today.</p>
          )}
          {daily?.rows?.map((r) => (
            <div key={r.rank} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="w-6 text-center font-bold text-slate-400">{r.rank}</span>
                <span className="font-medium">{r.name}</span>
              </div>
              <span className="text-sm text-slate-500">{r.time}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "monthly" && (
        <div className="space-y-4">
          {monthly?.winner && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-700">Current leader for the reward</p>
              <p className="text-lg font-bold text-amber-800">🏆 {monthly.winner.name}</p>
              <p className="text-xs text-amber-600">
                {monthly.winner.firstPlaceDays} earliest-arrival day(s) · avg {monthly.winner.avgTime}
              </p>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {!monthly && <p className="p-4 text-sm text-slate-400">Loading...</p>}
            {monthly?.rows?.length === 0 && (
              <p className="p-4 text-sm text-slate-400">No check-ins yet this month.</p>
            )}
            {monthly?.rows?.map((r) => (
              <div key={r.teacherId} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-slate-400">{r.rank}</span>
                  <span className="font-medium">{r.name}</span>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{r.firstPlaceDays} first-place day(s)</p>
                  <p className="text-xs text-slate-400">avg {r.avgTime} · {r.daysPresent} day(s) present</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
