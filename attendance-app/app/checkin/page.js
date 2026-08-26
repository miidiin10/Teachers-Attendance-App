"use client";
import { useEffect, useState } from "react";

export default function CheckinPage() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  const [coords, setCoords] = useState(null);
  const [locError, setLocError] = useState("");
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    fetch("/api/teachers/public")
      .then((r) => r.json())
      .then((d) => setTeachers(d.teachers || []));

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocError("Location unavailable - allow location access if check-in fails."),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    // Persistent per-browser id, used to enforce one device per day.
    try {
      let id = localStorage.getItem("attendance_device_id");
      if (!id) {
        id = crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("attendance_device_id", id);
      }
      setDeviceId(id);
    } catch (err) {
      // Private browsing / storage blocked - check-in still works, it just
      // won't be covered by the one-device-per-day check.
      setDeviceId(null);
    }
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          pin,
          lat: coords?.lat,
          lng: coords?.lng,
          deviceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: "error", message: data.error });
      } else {
        setStatus({
          type: "success",
          message: `You're in, ${data.name}! Checked in at ${data.time} - rank #${data.rank} today.`,
        });
        setPin("");
      }
    } catch (err) {
      setStatus({ type: "error", message: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pt-10 space-y-6">
      <h1 className="text-xl font-bold text-center">Check In</h1>

      <form onSubmit={submit} className="space-y-4 bg-white rounded-xl p-5 shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Your name</label>
          <select
            required
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3"
          >
            <option value="">Select your name</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">4-digit PIN</label>
          <input
            required
            inputMode="numeric"
            maxLength={4}
            pattern="\d{4}"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="w-full border border-slate-300 rounded-lg p-3 tracking-widest text-center text-lg"
            placeholder="****"
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-slate-900 text-white rounded-xl py-3 font-medium disabled:opacity-50"
        >
          {loading ? "Checking in..." : "Check In"}
        </button>
      </form>

      {status && (
        <p
          className={`text-center text-sm font-medium ${
            status.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}

      {locError && <p className="text-center text-xs text-slate-400">{locError}</p>}

      <p className="text-center text-xs text-slate-400">
        Ask the admin for your PIN if you don't have one yet.
      </p>
    </main>
  );
}
