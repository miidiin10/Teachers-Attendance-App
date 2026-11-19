import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { currentMonthInLagos, formatTimeInLagos } from "../../../lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonthInLagos();

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  const { data: teacherRows, error: teacherErr } = await supabaseAdmin
    .from("teachers")
    .select("id, name");
  if (teacherErr) return NextResponse.json({ error: teacherErr.message }, { status: 500 });
  const teachers = [...teacherRows].sort((a, b) => a.name.localeCompare(b.name));

  // Fetch all attendance records
  let attendanceRows = [];
  const pageSize = 1000;
  for (let page = 0; ; page++) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("teacher_id, checkin_date, checkin_time")
      .range(from, to);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) break;

    attendanceRows = attendanceRows.concat(data);
    if (data.length < pageSize) break;
    if (page > 50) break;
  }

  const records = {};
  for (const row of attendanceRows) {
    const dateStr = String(row.checkin_date).split("T")[0];
    if (!dateStr.startsWith(month)) continue;

    const day = Number(dateStr.split("-")[2]);
    if (!records[row.teacher_id]) records[row.teacher_id] = {};
    records[row.teacher_id][day] = formatTimeInLagos(row.checkin_time);
  }

  return NextResponse.json(
    { month, daysInMonth, teachers, records },
    { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      } 
    }
  );
}
