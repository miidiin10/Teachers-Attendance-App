import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { todayInLagos, formatTimeInLagos } from "../../../../lib/dates";

export const dynamic = "force-dynamic";

function checkAdmin(req) {
  const pw = req.headers.get("x-admin-password");
  return pw && pw === process.env.ADMIN_PASSWORD;
}

// Returns today's (or a given date's) check-ins with a short-lived signed
// URL for each selfie, so admins can spot-check that the right person
// checked in.
export async function GET(req) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayInLagos();

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("id, checkin_time, photo_path, lat, lng, teachers(name)")
    .eq("checkin_date", date)
    .order("checkin_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = await Promise.all(
    data.map(async (row) => {
      let photoUrl = null;
      if (row.photo_path) {
        const { data: signed } = await supabaseAdmin.storage
          .from("checkin-photos")
          .createSignedUrl(row.photo_path, 600); // 10 minutes
        photoUrl = signed?.signedUrl || null;
      }
      return {
        name: row.teachers?.name || "Unknown",
        time: formatTimeInLagos(row.checkin_time),
        photoUrl,
        hasLocation: row.lat !== null && row.lng !== null,
      };
    })
  );

  return NextResponse.json({ date, rows });
}
