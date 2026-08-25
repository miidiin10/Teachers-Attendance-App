// "use client";
// import { useEffect, useRef, useState } from "react";

// export default function CheckinPage() {
//   const [teachers, setTeachers] = useState([]);
//   const [teacherId, setTeacherId] = useState("");
//   const [pin, setPin] = useState("");
//   const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
//   const [loading, setLoading] = useState(false);

//   const [photoDataUrl, setPhotoDataUrl] = useState(null);
//   const [cameraOn, setCameraOn] = useState(false);
//   const [cameraError, setCameraError] = useState("");
//   const videoRef = useRef(null);
//   const streamRef = useRef(null);

//   const [coords, setCoords] = useState(null);
//   const [locError, setLocError] = useState("");

//   useEffect(() => {
//     fetch("/api/teachers/public")
//       .then((r) => r.json())
//       .then((d) => setTeachers(d.teachers || []));

//     if ("geolocation" in navigator) {
//       navigator.geolocation.getCurrentPosition(
//         (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//         () => setLocError("Location unavailable - allow location access if check-in fails."),
//         { enableHighAccuracy: true, timeout: 8000 }
//       );
//     }

//     return () => stopCamera();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   async function startCamera() {
//     setCameraError("");
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user", width: 320, height: 240 },
//       });
//       streamRef.current = stream;
//       setCameraOn(true);
//       setTimeout(() => {
//         if (videoRef.current) videoRef.current.srcObject = stream;
//       }, 0);
//     } catch (err) {
//       setCameraError("Camera access is required to check in. Please allow it and retry.");
//     }
//   }

//   function stopCamera() {
//     streamRef.current?.getTracks().forEach((t) => t.stop());
//     streamRef.current = null;
//     setCameraOn(false);
//   }

//   function capturePhoto() {
//     const video = videoRef.current;
//     if (!video) return;
//     const canvas = document.createElement("canvas");
//     canvas.width = 320;
//     canvas.height = 240;
//     canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
//     setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.6));
//     stopCamera();
//   }

//   function retake() {
//     setPhotoDataUrl(null);
//     startCamera();
//   }

//   async function submit(e) {
//     e.preventDefault();
//     setStatus(null);

//     if (!photoDataUrl) {
//       setStatus({ type: "error", message: "Please take a selfie to check in." });
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await fetch("/api/checkin", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           teacherId,
//           pin,
//           photoDataUrl,
//           lat: coords?.lat,
//           lng: coords?.lng,
//         }),
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         setStatus({ type: "error", message: data.error });
//       } else {
//         setStatus({
//           type: "success",
//           message: `You're in, ${data.name}! Checked in at ${data.time} - rank #${data.rank} today.`,
//         });
//         setPin("");
//         setPhotoDataUrl(null);
//       }
//     } catch (err) {
//       setStatus({ type: "error", message: "Network error. Try again." });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <main className="pt-10 space-y-6">
//       <h1 className="text-xl font-bold text-center">Check In</h1>

//       <form onSubmit={submit} className="space-y-4 bg-white rounded-xl p-5 shadow-sm">
//         <div>
//           <label className="block text-sm font-medium mb-1">Your name</label>
//           <select
//             required
//             value={teacherId}
//             onChange={(e) => setTeacherId(e.target.value)}
//             className="w-full border border-slate-300 rounded-lg p-3"
//           >
//             <option value="">Select your name</option>
//             {teachers.map((t) => (
//               <option key={t.id} value={t.id}>{t.name}</option>
//             ))}
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">4-digit PIN</label>
//           <input
//             required
//             inputMode="numeric"
//             maxLength={4}
//             pattern="\d{4}"
//             value={pin}
//             onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
//             className="w-full border border-slate-300 rounded-lg p-3 tracking-widest text-center text-lg"
//             placeholder="****"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium mb-1">
//             Selfie (confirms it's really you)
//           </label>

//           {!cameraOn && !photoDataUrl && (
//             <button
//               type="button"
//               onClick={startCamera}
//               className="w-full border border-slate-300 rounded-lg py-3 text-sm font-medium"
//             >
//               Open Camera
//             </button>
//           )}

//           {cameraOn && (
//             <div className="space-y-2">
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 className="w-full rounded-lg bg-black"
//               />
//               <button
//                 type="button"
//                 onClick={capturePhoto}
//                 className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium"
//               >
//                 Take Photo
//               </button>
//             </div>
//           )}

//           {photoDataUrl && (
//             <div className="space-y-2">
//               <img src={photoDataUrl} alt="Your selfie" className="w-full rounded-lg" />
//               <button
//                 type="button"
//                 onClick={retake}
//                 className="w-full border border-slate-300 rounded-lg py-2 text-sm font-medium"
//               >
//                 Retake
//               </button>
//             </div>
//           )}

//           {cameraError && <p className="text-red-600 text-xs mt-1">{cameraError}</p>}
//         </div>

//         <button
//           disabled={loading}
//           className="w-full bg-slate-900 text-white rounded-xl py-3 font-medium disabled:opacity-50"
//         >
//           {loading ? "Checking in..." : "Check In"}
//         </button>
//       </form>

//       {status && (
//         <p
//           className={`text-center text-sm font-medium ${
//             status.type === "success" ? "text-green-600" : "text-red-600"
//           }`}
//         >
//           {status.message}
//         </p>
//       )}

//       {locError && <p className="text-center text-xs text-slate-400">{locError}</p>}

//       <p className="text-center text-xs text-slate-400">
//         Ask the admin for your PIN if you don't have one yet.
//       </p>
//     </main>
//   );
// }

"use client";
import { useEffect, useRef, useState } from "react";

export default function CheckinPage() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState("");
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [loading, setLoading] = useState(false);

  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [locError, setLocError] = useState("");

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

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 320, height: 240 },
      });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch (err) {
      setCameraError("Camera access is required to check in. Please allow it and retry.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    canvas.getContext("2d").drawImage(video, 0, 0, 320, 240);
    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.6));
    stopCamera();
  }

  function retake() {
    setPhotoDataUrl(null);
    startCamera();
  }

  async function submit(e) {
    e.preventDefault();
    setStatus(null);

    if (!photoDataUrl) {
      setStatus({ type: "error", message: "Please take a selfie to check in." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          pin,
          photoDataUrl,
          lat: coords?.lat,
          lng: coords?.lng,
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
        setPhotoDataUrl(null);
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

        <div>
          <label className="block text-sm font-medium mb-1">
            Selfie (confirms it's really you)
          </label>

          {!cameraOn && !photoDataUrl && (
            <button
              type="button"
              onClick={startCamera}
              className="w-full border border-slate-300 rounded-lg py-3 text-sm font-medium"
            >
              Open Camera
            </button>
          )}

          {cameraOn && (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg bg-black"
              />
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full bg-slate-900 text-white rounded-lg py-2 text-sm font-medium"
              >
                Take Photo
              </button>
            </div>
          )}

          {photoDataUrl && (
            <div className="space-y-2">
              <img src={photoDataUrl} alt="Your selfie" className="w-full rounded-lg" />
              <button
                type="button"
                onClick={retake}
                className="w-full border border-slate-300 rounded-lg py-2 text-sm font-medium"
              >
                Retake
              </button>
            </div>
          )}

          {cameraError && <p className="text-red-600 text-xs mt-1">{cameraError}</p>}
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

