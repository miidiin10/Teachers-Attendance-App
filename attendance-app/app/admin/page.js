"use client";
import { useState } from "react";
import QRCode from "qrcode";
import { fetchFresh } from "../../lib/fetchFresh";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [checkins, setCheckins] = useState([]);

  async function login(e) {
    e.preventDefault();
    setError("");
    const res = await fetchFresh("/api/teachers", { headers: { "x-admin-password": pw } });
    if (res.ok) {
      setAuthed(true);
      const data = await res.json();
      setTeachers(data.teachers);
      loadCheckins(pw);
      loadQr(pw);
    } else if (res.status === 401) {
      setError("Wrong password.");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || `Something went wrong (error ${res.status}). Check server logs.`);
    }
  }

  async function loadCheckins(password) {
    const res = await fetchFresh("/api/admin/checkins", { headers: { "x-admin-password": password } });
    if (res.ok) {
      const data = await res.json();
      setCheckins(data.rows);
    }
  }

  async function loadQr(password) {
    const res = await fetchFresh("/api/admin/checkin-link", { headers: { "x-admin-password": password } });
    if (res.ok) {
      const { url } = await res.json();
      const dataUrl = await QRCode.toDataURL(url, { width: 240 });
      setQrUrl(dataUrl);
    }
  }

  async function refresh() {
    const res = await fetchFresh("/api/teachers", { headers: { "x-admin-password": pw } });
    const data = await res.json();
    setTeachers(data.teachers);
  }

  async function addTeacher(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ name, pin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
    } else {
      setName("");
      setPin("");
      refresh();
    }
  }

  async function removeTeacher(id) {
    if (!confirm("Remove this teacher and their attendance history?")) return;
    await fetch("/api/teachers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  async function unlockTeacher(id) {
    await fetch("/api/teachers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": pw },
      body: JSON.stringify({ id }),
    });
    refresh();
  }

  if (!authed) {
    return (
      <main className="pt-16">
        <h1 className="text-xl font-bold text-center mb-6">Admin Login</h1>
        <form onSubmit={login} className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Admin password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500"
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
          <button className="w-full bg-slate-900 text-white rounded-xl py-3 font-medium">
            Log In
          </button>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="pt-10 space-y-6 pb-16">
      <h1 className="text-xl font-bold text-center">Admin</h1>

      <div className="bg-white rounded-xl p-5 shadow-sm text-center space-y-2">
        <p className="font-medium text-sm text-slate-600">Check-in QR code</p>
        {qrUrl && <img src={qrUrl} alt="Check-in QR code" className="mx-auto" />}
        <p className="text-[10px] text-slate-400 italic whitespace-nowrap">
          built by meeddev@gmail.com(08067265806)
        </p>
      </div>

      <form onSubmit={addTeacher} className="bg-white rounded-xl p-5 shadow-sm space-y-3">
        <p className="font-medium text-sm text-slate-600">Add a teacher</p>
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-3"
          required
        />
        <input
          placeholder="4-digit PIN"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-full border border-slate-300 rounded-lg p-3"
          required
        />
        <button className="w-full bg-slate-900 text-white rounded-xl py-3 font-medium">
          Add Teacher
        </button>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        <p className="p-4 font-medium text-sm text-slate-600">Today's check-ins</p>
        {checkins.length === 0 && (
          <p className="p-4 text-sm text-slate-400">No check-ins yet today.</p>
        )}
        {checkins.map((c, i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <span className="font-medium">{c.name}</span>
            <div className="text-right">
              <p className="text-sm text-slate-500">{c.time}</p>
              <p className="text-xs text-slate-400">
                {c.hasLocation ? "Location recorded" : "No location recorded"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        <p className="p-4 font-medium text-sm text-slate-600">Teachers ({teachers.length})</p>
        {teachers.map((t) => {
          const isLocked = t.locked_until && new Date(t.locked_until) > new Date();
          return (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-slate-400">PIN {t.pin}</p>
                {isLocked && (
                  <p className="text-xs text-red-600 mt-0.5">
                    Locked until {new Date(t.locked_until).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isLocked && (
                  <button onClick={() => unlockTeacher(t.id)} className="text-amber-600 text-sm">
                    Unlock
                  </button>
                )}
                <button onClick={() => removeTeacher(t.id)} className="text-red-600 text-sm">
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
