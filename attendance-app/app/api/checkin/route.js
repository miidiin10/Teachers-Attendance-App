import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { todayInLagos, formatTimeInLagos, parseHHMM, currentMinutesInLagos } from "../../../lib/dates";
import { getSchoolZones, isWithinAnyZone } from "../../../lib/geofence";

const LOCKOUT_ATTEMPTS = Number(process.env.PIN_LOCKOUT_ATTEMPTS) || 5;
const LOCKOUT_MINUTES = Number(process.env.PIN_LOCKOUT_MINUTES) || 10;

export async function POST(req) {
  try {
    const { teacherId, pin, lat, lng, deviceId } = await req.json();
    if (!teacherId || !pin) {
      return NextResponse.json({ error: "Missing teacher or PIN." }, { status: 400 });
    }

    // Optional school-hours window - reject outright if outside it.
    const openTime = process.env.CHECKIN_OPEN_TIME;
    const closeTime = process.env.CHECKIN_CLOSE_TIME;
    if (openTime && closeTime) {
      const now = currentMinutesInLagos();
      if (now < parseHHMM(openTime) || now > parseHHMM(closeTime)) {
        return NextResponse.json(
          { error: `Check-in is only open between ${openTime} and ${closeTime}.` },
          { status: 403 }
        );
      }
    }

    const { data: teacher, error: teacherErr } = await supabaseAdmin
      .from("teachers")
      .select("id, name, pin, active, failed_attempts, locked_until")
      .eq("id", teacherId)
      .single();

    if (teacherErr || !teacher) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }
    if (!teacher.active) {
      return NextResponse.json({ error: "This teacher profile is inactive." }, { status: 403 });
    }

    // PIN lockout check
    if (teacher.locked_until && new Date(teacher.locked_until) > new Date()) {
      const minsLeft = Math.ceil((new Date(teacher.locked_until) - new Date()) / 60000);
      return NextResponse.json(
        { error: `Too many wrong PIN attempts. Try again in ${minsLeft} minute(s), or ask an admin to unlock you.` },
        { status: 429 }
      );
    }

    if (String(teacher.pin) !== String(pin)) {
      const attempts = (teacher.failed_attempts || 0) + 1;
      const update = { failed_attempts: attempts };
      let message = "Incorrect PIN.";
      if (attempts >= LOCKOUT_ATTEMPTS) {
        update.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
        update.failed_attempts = 0;
        message = `Too many wrong PIN attempts. Locked for ${LOCKOUT_MINUTES} minutes.`;
      }
      await supabaseAdmin.from("teachers").update(update).eq("id", teacher.id);
      return NextResponse.json({ error: message }, { status: 401 });
    }

    // Correct PIN - clear any prior failed attempts.
    if (teacher.failed_attempts > 0 || teacher.locked_until) {
      await supabaseAdmin.from("teachers").update({ failed_attempts: 0, locked_until: null }).eq("id", teacher.id);
    }

    // Optional geofence - only enforced if at least one zone is configured.
    const zones = getSchoolZones();
    if (zones.length > 0) {
      if (typeof lat !== "number" || typeof lng !== "number") {
        return NextResponse.json(
          { error: "Location is required to check in. Please allow location access and try again." },
          { status: 400 }
        );
      }
      const result = isWithinAnyZone(lat, lng, zones);
      if (!result.ok) {
        return NextResponse.json(
          { error: "You don't appear to be at an approved check-in location." },
          { status: 403 }
        );
      }
    }

    const date = todayInLagos();

    // One-device-per-day check: has this device already checked in a
    // *different* teacher today?
    if (deviceId) {
      const { data: deviceRows } = await supabaseAdmin
        .from("attendance")
        .select("teacher_id")
        .eq("checkin_date", date)
        .eq("device_id", deviceId)
        .neq("teacher_id", teacher.id)
        .limit(1);
      if (deviceRows && deviceRows.length > 0) {
        return NextResponse.json(
          { error: "This device already checked in a different teacher today. Please use your own device." },
          { status: 403 }
        );
      }
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("attendance")
      .insert({
        teacher_id: teacher.id,
        checkin_date: date,
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
        device_id: deviceId || null,
      })
      .select("checkin_time")
      .single();

    if (insertErr) {
      // unique(teacher_id, checkin_date) violation = already checked in today
      if (insertErr.code === "23505") {
        const { data: existing } = await supabaseAdmin
          .from("attendance")
          .select("checkin_time")
          .eq("teacher_id", teacher.id)
          .eq("checkin_date", date)
          .single();
        if (existing) {
          return NextResponse.json(
            { error: `You already checked in today at ${formatTimeInLagos(existing.checkin_time)}.` },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: "This device was already used to check in today." },
          { status: 409 }
        );
      }
      throw insertErr;
    }

    const { count } = await supabaseAdmin
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("checkin_date", date)
      .lte("checkin_time", inserted.checkin_time);

    return NextResponse.json({
      name: teacher.name,
      time: formatTimeInLagos(inserted.checkin_time),
      rank: count || 1,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: `Something went wrong: ${err.message || "unknown error"}. Try again.` },
      { status: 500 }
    );
  }
}
