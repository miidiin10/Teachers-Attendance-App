import { distanceMeters } from "./geo";

// Supports two ways of configuring where check-in is allowed:
//
// 1. Multiple zones (recommended if you have more than one building/campus,
//    or want an irregular area covered by a few overlapping circles):
//    SCHOOL_ZONES = '[{"name":"Main Campus","lat":6.5244,"lng":3.3792,"radius":150},
//                     {"name":"Annex","lat":6.5300,"lng":3.3800,"radius":100}]'
//
// 2. A single point (kept for backwards compatibility):
//    SCHOOL_LAT / SCHOOL_LNG / SCHOOL_RADIUS_METERS
//
// If neither is set, geofencing is skipped entirely.
export function getSchoolZones() {
  const raw = process.env.SCHOOL_ZONES;
  if (raw) {
    try {
      const zones = JSON.parse(raw);
      if (Array.isArray(zones) && zones.length > 0) return zones;
    } catch (err) {
      console.error("SCHOOL_ZONES is not valid JSON:", err.message);
    }
  }

  if (process.env.SCHOOL_LAT && process.env.SCHOOL_LNG) {
    return [
      {
        name: "School",
        lat: Number(process.env.SCHOOL_LAT),
        lng: Number(process.env.SCHOOL_LNG),
        radius: Number(process.env.SCHOOL_RADIUS_METERS) || 150,
      },
    ];
  }

  return []; // geofencing disabled
}

// Returns { ok: true } or { ok: false } - never throws, so a bad zone
// config can't take down check-in entirely.
export function isWithinAnyZone(lat, lng, zones) {
  for (const zone of zones) {
    try {
      const dist = distanceMeters(zone.lat, zone.lng, lat, lng);
      if (dist <= zone.radius) return { ok: true, zone: zone.name };
    } catch (err) {
      console.error("Skipping invalid zone in SCHOOL_ZONES:", zone, err.message);
    }
  }
  return { ok: false };
}
