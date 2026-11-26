import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { currentMonthInLagos, formatTimeInLagos } from "../../../lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || currentMonthInLagos();

    const [year, mon] = month.split("-").map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    const { data: teacherRows, error: teacherErr } = await supabaseAdmin
      .from("teachers")
      .select("id, name");
    if (teacherErr) {
      console.error("Teacher fetch error:", teacherErr);
      return NextResponse.json({ error: teacherErr.message }, { status: 500 });
    }
    const teachers = [...teacherRows].sort((a, b) => a.name.localeCompare(b.name));

    const startDate = `${month}-01`;
    const endDate = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, "0")}-01`;

    const { data: attendanceRows, error: attErr } = await supabaseAdmin
      .from("attendance")
      .select("teacher_id, checkin_date, checkin_time")
      .gte("checkin_date", startDate)
      .lt("checkin_date", endDate)
      .order("checkin_date", { ascending: true });

    if (attErr) {
      console.error("Attendance fetch error:", attErr);
      return NextResponse.json({ error: attErr.message }, { status: 500 });
    }

    const records = {};
    if (attendanceRows) {
      for (const row of attendanceRows) {
        const dateStr = String(row.checkin_date).split("T")[0];
        const day = Number(dateStr.split("-")[2]);
        
        if (!records[row.teacher_id]) records[row.teacher_id] = {};
        records[row.teacher_id][day] = formatTimeInLagos(row.checkin_time);
      }
    }

    return NextResponse.json(
      { month, daysInMonth, teachers, records },
      { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        } 
      }
    );
  } catch (err) {
    console.error("API route crashed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
