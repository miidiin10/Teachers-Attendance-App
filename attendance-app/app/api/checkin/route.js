import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { todayInLagos, formatTimeInLagos } from "../../../lib/dates";
import { getSchoolZones, isWithinAnyZone } from "../../../lib/geofence";

export async function POST(req) {
  try {
    const { teacherId, pin, lat, lng } = await req.json();
    if (!teacherId || !pin) {
      return NextResponse.json({ error: "Missing teacher or PIN." }, { status: 400 });
    }

    const { data: teacher, error: teacherErr } = await supabaseAdmin
      .from("teachers")
      .select("id, name, pin, active")
      .eq("id", teacherId)
      .single();

    if (teacherErr || !teacher) {
      return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
    }
    if (!teacher.active) {
      return NextResponse.json({ error: "This teacher profile is inactive." }, { status: 403 });
    }
    if (String(teacher.pin) !== String(pin)) {
      return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
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

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("attendance")
      .insert({
        teacher_id: teacher.id,
        checkin_date: date,
        lat: typeof lat === "number" ? lat : null,
        lng: typeof lng === "number" ? lng : null,
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
        return NextResponse.json(
          {
            error: `You already checked in today at ${formatTimeInLagos(existing.checkin_time)}.`,
          },
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
