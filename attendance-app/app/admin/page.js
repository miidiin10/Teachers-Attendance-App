"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

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
    const res = await fetch("/api/teachers", { headers: { "x-admin-password": pw } });
    if (res.ok) {
      setAuthed(true);
      const data = await res.json();
      setTeachers(data.teachers);
      loadCheckins(pw);
    } else if (res.status === 401) {
      setError("Wrong password.");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || `Something went wrong (error ${res.status}). Check server logs.`);
    }
  }

  async function loadCheckins(password) {
    const res = await fetch("/api/admin/checkins", { headers: { "x-admin-password": password } });
    if (res.ok) {
      const data = await res.json();
      setCheckins(data.rows);
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkinUrl = `${window.location.origin}/checkin`;
      QRCode.toDataURL(checkinUrl, { width: 240 }).then(setQrUrl);
    }
  }, []);

  async function refresh() {
    const res = await fetch("/api/teachers", { headers: { "x-admin-password": pw } });
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
        <p className="text-xs text-slate-400">Print this and put it at the entrance.</p>
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
        <p className="p-4 font-medium text-sm text-slate-600">
          Today's check-ins - tap a name to verify their selfie
        </p>
        {checkins.length === 0 && (
          <p className="p-4 text-sm text-slate-400">No check-ins yet today.</p>
        )}
        {checkins.map((c, i) => (
          <details key={i} className="p-4">
            <summary className="flex items-center justify-between cursor-pointer">
              <span className="font-medium">{c.name}</span>
              <span className="text-sm text-slate-500">{c.time}</span>
            </summary>
            <div className="pt-3 space-y-1">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt={`${c.name} selfie`} className="rounded-lg w-40" />
              ) : (
                <p className="text-xs text-slate-400">No photo on file.</p>
              )}
              <p className="text-xs text-slate-400">
                {c.hasLocation ? "Location recorded" : "No location recorded"}
              </p>
            </div>
          </details>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm divide-y">
        <p className="p-4 font-medium text-sm text-slate-600">Teachers ({teachers.length})</p>
        {teachers.map((t) => (
          <div key={t.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-slate-400">PIN {t.pin}</p>
            </div>
            <button onClick={() => removeTeacher(t.id)} className="text-red-600 text-sm">
              Remove
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
