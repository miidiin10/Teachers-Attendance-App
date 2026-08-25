import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { todayInLagos, currentMonthInLagos, formatTimeInLagos, minutesSinceMidnightLagos } from "../../../lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily";

  if (type === "daily") {
    const date = searchParams.get("date") || todayInLagos();
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("checkin_time, teachers(name)")
      .eq("checkin_date", date)
      .order("checkin_time", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data.map((row, i) => ({
      rank: i + 1,
      name: row.teachers?.name || "Unknown",
      time: formatTimeInLagos(row.checkin_time),
    }));
    return NextResponse.json({ date, rows });
  }

  if (type === "monthly") {
    const month = searchParams.get("month") || currentMonthInLagos();
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("checkin_date, checkin_time, teacher_id, teachers(name)")
      .gte("checkin_date", `${month}-01`)
      .lt("checkin_date", nextMonthStart(month))
      .order("checkin_time", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Group by day to find each day's #1 earliest teacher, then tally.
    const byDay = {};
    for (const row of data) {
      if (!byDay[row.checkin_date]) byDay[row.checkin_date] = [];
      byDay[row.checkin_date].push(row);
    }

    const stats = {}; // teacher_id -> { name, firstPlaceDays, daysPresent, totalMinutes }
    for (const date of Object.keys(byDay)) {
      const dayRows = byDay[date]; // already sorted by checkin_time
      dayRows.forEach((row, i) => {
        const id = row.teacher_id;
        if (!stats[id]) {
          stats[id] = { name: row.teachers?.name || "Unknown", firstPlaceDays: 0, daysPresent: 0, totalMinutes: 0 };
        }
        stats[id].daysPresent += 1;
        stats[id].totalMinutes += minutesSinceMidnightLagos(row.checkin_time);
        if (i === 0) stats[id].firstPlaceDays += 1;
      });
    }

    const ranked = Object.entries(stats)
      .map(([id, s]) => ({
        teacherId: id,
        name: s.name,
        firstPlaceDays: s.firstPlaceDays,
        daysPresent: s.daysPresent,
        avgMinutes: s.totalMinutes / s.daysPresent,
      }))
      .sort((a, b) => b.firstPlaceDays - a.firstPlaceDays || a.avgMinutes - b.avgMinutes)
      .map((s, i) => ({
        ...s,
        rank: i + 1,
        avgTime: minutesToClock(s.avgMinutes),
      }));

    return NextResponse.json({ month, rows: ranked, winner: ranked[0] || null });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

function nextMonthStart(month) {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return next;
}

function minutesToClock(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}
