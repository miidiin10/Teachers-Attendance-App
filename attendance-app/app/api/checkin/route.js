import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { todayInLagos, formatTimeInLagos } from "../../../lib/dates";
import { distanceMeters } from "../../../lib/geo";

export async function POST(req) {
  try {
    const { teacherId, pin, photoDataUrl, lat, lng } = await req.json();
    if (!teacherId || !pin) {
      return NextResponse.json({ error: "Missing teacher or PIN." }, { status: 400 });
    }
    if (!photoDataUrl) {
      return NextResponse.json({ error: "A selfie is required to check in." }, { status: 400 });
    }

    // Optional geofence - only enforced if the school's coordinates are configured.
    const schoolLat = process.env.SCHOOL_LAT;
    const schoolLng = process.env.SCHOOL_LNG;
    if (schoolLat && schoolLng) {
      if (typeof lat !== "number" || typeof lng !== "number") {
        return NextResponse.json(
          { error: "Location is required to check in. Please allow location access and try again." },
          { status: 400 }
        );
      }
      const radius = Number(process.env.SCHOOL_RADIUS_METERS) || 150;
      const dist = distanceMeters(Number(schoolLat), Number(schoolLng), lat, lng);
      if (dist > radius) {
        return NextResponse.json(
          { error: "You don't appear to be at school. Check in once you arrive." },
          { status: 403 }
        );
      }
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

    const date = todayInLagos();

    // Upload the selfie first so a failed upload doesn't leave a check-in
    // row with no photo.
    const base64 = photoDataUrl.split(",")[1];
    if (!base64) {
      return NextResponse.json({ error: "Invalid photo. Try again." }, { status: 400 });
    }
    const photoPath = `${date}/${teacher.id}-${Date.now()}.jpg`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from("checkin-photos")
      .upload(photoPath, Buffer.from(base64, "base64"), { contentType: "image/jpeg" });
    if (uploadErr) {
      console.error(uploadErr);
      return NextResponse.json({ error: "Could not save your selfie. Try again." }, { status: 500 });
    }

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("attendance")
      .insert({
        teacher_id: teacher.id,
        checkin_date: date,
        photo_path: photoPath,
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
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
