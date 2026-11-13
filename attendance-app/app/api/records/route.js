import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { currentMonthInLagos, formatTimeInLagos } from "../../../lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || currentMonthInLagos(); // YYYY-MM

  const [year, mon] = month.split("-").map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();

  // 1. Fetch teachers (removed .eq("active", true) temporarily so we can see ALL teachers)
  const { data: teacherRows, error: teacherErr } = await supabaseAdmin
    .from("teachers")
    .select("id, name, active");
    
  if (teacherErr) return NextResponse.json({ error: teacherErr.message }, { status: 500 });
  
  // Sort alphabetically
  const teachers = [...teacherRows].sort((a, b) => a.name.localeCompare(b.name));

  const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
  
  const { data: attendanceRows, error: attErr } = await supabaseAdmin
    .from("attendance")
    .select("teacher_id, checkin_date, checkin_time")
    .gte("checkin_date", `${month}-01`)
    .lt("checkin_date", nextMonth);
    
  if (attErr) return NextResponse.json({ error: attErr.message }, { status: 500 });

  const records = {};
  for (const row of attendanceRows) {
    // 2. SAFER DAY EXTRACTION: Handles both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS..."
    const dateString = String(row.checkin_date).split("T")[0]; // Gets exactly "YYYY-MM-DD"
    const day = Number(dateString.split("-")[2]); // Gets the clean day number (e.g., 11)
    
    if (!records[row.teacher_id]) records[row.teacher_id] = {};
    records[row.teacher_id][day] = formatTimeInLagos(row.checkin_time);
  }

  // 3. Removed the Cache-Control header entirely to prevent ANY edge caching
  return NextResponse.json({ month, daysInMonth, teachers, records });
}
