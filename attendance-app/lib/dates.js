// All arrival-time logic is anchored to Lagos time (WAT, UTC+1),
// regardless of what timezone the server or the teacher's phone is in.
const TZ = "Africa/Lagos";

export function todayInLagos() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

export function currentMonthInLagos() {
  const d = todayInLagos();
  return d.slice(0, 7); // YYYY-MM
}

export function formatTimeInLagos(isoString) {
  return new Date(isoString).toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Minutes since midnight (Lagos time) - used to average arrival times.
export function minutesSinceMidnightLagos(isoString) {
  const parts = new Date(isoString).toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const [h, m, s] = parts.split(":").map(Number);
  return h * 60 + m + s / 60;
}
