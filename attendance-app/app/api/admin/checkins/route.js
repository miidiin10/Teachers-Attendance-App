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

  // ✅ ADDED: .eq('teachers.active', true) 
  // This ensures that if a teacher is deleted (set to active=false), 
  // they immediately disappear from the daily check-in list.
  const { data: rawData, error } = await supabaseAdmin
    .from("attendance")
    .select("checkin_time, lat, lng, teachers(name, active)") // <-- Added 'active' here
    .eq("checkin_date", date)
    .eq("teachers.active", true); // <-- Filters out deleted teachers

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const data = [...rawData].sort((a, b) => new Date(a.checkin_time) - new Date(b.checkin_time));
  const rows = data.map((row) => ({
    name: row.teachers?.name || "Unknown",
    time: formatTimeInLagos(row.checkin_time),
    hasLocation: row.lat !== null && row.lng !== null,
  }));

  // ✅ ADDED: Cache-Control headers to force fresh data every time
  return NextResponse.json(
    { date, rows },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}
