import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { todayInLagos, formatTimeInLagos } from "../../../../lib/dates";

export const dynamic = "force-dynamic";

function checkAdmin(req) {
  const pw = req.headers.get("x-admin-password");
  return pw && pw === process.env.ADMIN_PASSWORD;
}

// Returns today's (or a given date's) check-ins for a quick admin overview.
export async function GET(req) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || todayInLagos();

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("checkin_time, lat, lng, teachers(name)")
    .eq("checkin_date", date)
    .order("checkin_time", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data.map((row) => ({
    name: row.teachers?.name || "Unknown",
    time: formatTimeInLagos(row.checkin_time),
    hasLocation: row.lat !== null && row.lng !== null,
  }));

  return NextResponse.json({ date, rows });
}
