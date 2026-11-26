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
    if (teacherErr) return NextResponse.json({ error: teacherErr.message }, { status: 500 });
    const teachers = [...teacherRows].sort((a, b) => a.name.localeCompare(b.name));

    // Fetch ALL records with robust pagination
    let attendanceRows = [];
    const pageSize = 1000;
    let page = 0;
    let keepFetching = true;

    while (keepFetching) {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabaseAdmin
        .from("attendance")
        .select("teacher_id, checkin_date, checkin_time")
        .range(from, to);

      if (error) {
        console.error(`Pagination error on page ${page}:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data || data.length === 0) {
        console.log(`Pagination stopped at page ${page} - no more data`);
        keepFetching = false;
      } else {
        attendanceRows = attendanceRows.concat(data);
        console.log(`Page ${page}: fetched ${data.length} records (total: ${attendanceRows.length})`);
        
        if (data.length < pageSize) {
          console.log(`Last page reached - got ${data.length} records instead of ${pageSize}`);
          keepFetching = false;
        }
        
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 100) {
          console.log(`Safety limit reached at page ${page}`);
          keepFetching = false;
        }
      }
    }

    console.log(`Total records fetched: ${attendanceRows.length}`);

    // Filter in JavaScript
    const records = {};
    let todayCount = 0;
    for (const row of attendanceRows) {
      const dateStr = String(row.checkin_date).split("T")[0];
      if (!dateStr.startsWith(month)) continue;

      const day = Number(dateStr.split("-")[2]);
      if (!records[row.teacher_id]) records[row.teacher_id] = {};
      records[row.teacher_id][day] = formatTimeInLagos(row.checkin_time);
      
      if (day === 26) todayCount++;
    }

    console.log(`Records for day 26: ${todayCount} teachers`);

    return NextResponse.json(
      { 
        month, 
        daysInMonth, 
        teachers, 
        records,
        debug: {
          totalRecordsFetched: attendanceRows.length,
          recordsForDay26: todayCount
        }
      },
      { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        } 
      }
    );
  } catch (err) {
    console.error("API route crashed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
