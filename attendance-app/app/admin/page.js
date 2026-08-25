"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  async function login(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/teachers", { headers: { "x-admin-password": pw } });
    if (res.ok) {
      setAuthed(true);
      const data = await res.json();
      setTeachers(data.teachers);
    } else {
      setError("Wrong password.");
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
          <input
            type="password"
            placeholder="Admin password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3"
          />
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
