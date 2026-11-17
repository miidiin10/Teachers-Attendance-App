import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { currentMonthInLagos, formatTimeInLagos } from "../../../lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonthInLagos(); // YYYY-MM

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  // 1. Fetch teachers
  const { data: teacherRows, error: teacherErr } = await supabaseAdmin
    .from("teachers")
    .select("id, name");
    
  if (teacherErr) return NextResponse.json({ error: teacherErr.message }, { status: 500 });
  const teachers = [...teacherRows].sort((a, b) => a.name.localeCompare(b.name));

  // 2. Fetch ALL attendance records (No date filter here to avoid Supabase timezone bugs)
  const { data: attendanceRows, error: attErr } = await supabaseAdmin
    .from("attendance")
    .select("teacher_id, checkin_date, checkin_time");
    
  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });

  // 3. BULLETPROOF FILTER: Filter the dates in JavaScript instead of Supabase
  const filteredRows = attendanceRows.filter(row => {
    const dateStr = String(row.checkin_date).split("T")[0]; // Gets exactly "YYYY-MM-DD"
    return dateStr.startsWith(month); // e.g., "2026-11-11" starts with "2026-11"
  });

  // 4. Build the records object
  const records = {};
  for (const row of filteredRows) {
    const dateString = String(row.checkin_date).split("T")[0];
    const day = Number(dateString.split("-")[2]); // Gets the clean day number (e.g., 11)
    
    if (!records[row.teacher_id]) records[row.teacher_id] = {};
    records[row.teacher_id][day] = formatTimeInLagos(row.checkin_time);
  }

  return NextResponse.json({ month, daysInMonth, teachers, records });
}
