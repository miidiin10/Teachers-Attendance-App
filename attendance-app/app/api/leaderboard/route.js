import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { todayInLagos, currentMonthInLagos, formatTimeInLagos, minutesSinceMidnightLagos } from "../../../lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily";

  if (type === "daily") {
    const date = searchParams.get("date") || todayInLagos();
    
    // 1. Fetch ALL attendance records in chunks of 1000
    let rawData = [];
    const pageSize = 1000;
    for (let page = 0; ; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabaseAdmin
        .from("attendance")
        .select("checkin_date, checkin_time, teachers(name)") // Added checkin_date to the select!
        .range(from, to);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data || data.length === 0) break;

      rawData = rawData.concat(data);
      if (data.length < pageSize) break;
      if (page > 50) break;
    }

    // 2. Filter in JavaScript (Bulletproof: ignores Supabase timestamp quirks)
    const filteredData = rawData.filter(row => {
      const dateStr = String(row.checkin_date).split("T")[0]; // Gets exactly "YYYY-MM-DD"
      return dateStr === date; // Only keep today's date
    });

    const sortedData = [...filteredData].sort((a, b) => new Date(a.checkin_time) - new Date(b.checkin_time));
    const rows = sortedData.map((row, i) => ({
      rank: i + 1,
      name: row.teachers?.name || "Unknown",
      time: formatTimeInLagos(row.checkin_time),
    }));
    
    return NextResponse.json(
      { date, rows },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  }

  if (type === "monthly") {
    const month = searchParams.get("month") || currentMonthInLagos();
    
    // 1. Fetch ALL attendance records in chunks of 1000
    let rawData = [];
    const pageSize = 1000;
    for (let page = 0; ; page++) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabaseAdmin
        .from("attendance")
        .select("checkin_date, checkin_time, teacher_id, teachers(name)")
        .range(from, to);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data || data.length === 0) break;

      rawData = rawData.concat(data);
      if (data.length < pageSize) break;
      if (page > 50) break;
    }

    // 2. Filter in JavaScript to avoid Supabase timezone/date filtering bugs
    const filteredData = rawData.filter(row => {
      const dateStr = String(row.checkin_date).split("T")[0];
      return dateStr.startsWith(month);
    });

    const data = [...filteredData].sort((a, b) => new Date(a.checkin_time) - new Date(b.checkin_time));

    // 3. Group by day to find each day's #1 earliest teacher, then tally.
    const byDay = {};
    for (const row of data) {
      if (!byDay[row.checkin_date]) byDay[row.checkin_date] = [];
      byDay[row.checkin_date].push(row);
    }

    const stats = {}; 
    for (const dateKey of Object.keys(byDay)) {
      const dayRows = byDay[dateKey]; 
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

    return NextResponse.json(
      { month, rows: ranked, winner: ranked[0] || null },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    );
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

function minutesToClock(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}
