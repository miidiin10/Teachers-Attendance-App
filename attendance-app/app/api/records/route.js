import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { currentMonthInLagos, formatTimeInLagos } from "../../../lib/dates";

export const dynamic = "force-dynamic";

// Full daily attendance register for a given month - every teacher, every
// day, what time they checked in (or blank if they didn't). Always
// defaults to the current month, so it naturally "resets" itself on the
// 1st - last month's data isn't deleted, it's just not what loads by
// default anymore.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonthInLagos(); // YYYY-MM

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  // Not using .order() - unreliable on this project. Sort in JS instead.
  const { data: teacherRows, error: teacherErr } = await supabaseAdmin
    .from("teachers")
    .select("id, name")
    .eq("active", true);
  if (teacherErr) return NextResponse.json({ error: teacherErr.message }, { status: 500 });
  const teachers = [...teacherRows].sort((a, b) => a.name.localeCompare(b.name));

  const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
  const { data: attendanceRows, error: attErr } = await supabaseAdmin
    .from("attendance")
    .select("teacher_id, checkin_date, checkin_time")
    .gte("checkin_date", `${month}-01`)
    .lt("checkin_date", nextMonth);
  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });

  // records[teacherId][dayNumber] = "HH:MM:SS"
  const records = {};
  for (const row of attendanceRows) {
    const day = Number(row.checkin_date.split("-")[2]);
    if (!records[row.teacher_id]) records[row.teacher_id] = {};
    records[row.teacher_id][day] = formatTimeInLagos(row.checkin_time);
  }

  return NextResponse.json(
    { month, daysInMonth, teachers, records },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180" } }
  );
}
