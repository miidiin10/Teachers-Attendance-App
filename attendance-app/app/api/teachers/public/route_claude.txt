import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// Without this, Next.js caches this route at build time since it doesn't
// read anything from the request - meaning newly added teachers would
// never show up on /checkin without a fresh deploy. Force it to run fresh
// on every request instead.
export const dynamic = "force-dynamic";

// Public endpoint used by the /checkin page - only exposes id + name,
// never the PIN.
export async function GET() {
  // Deliberately NOT using .order() here - for reasons still under
  // investigation, adding .order("name") to this specific query was
  // causing far fewer rows to come back than actually exist. Sorting in
  // JS after the fact sidesteps it entirely.
  const { data, error } = await supabaseAdmin
    .from("teachers")
    .select('id, name, active')
    .eq("active", true);


  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(
    { teachers: sorted },
    // Cached at Vercel's edge briefly (stale-while-revalidate keeps serving
    // slightly-stale data for a short window while a fresh copy is fetched
    // in the background). Short enough that admin changes show up quickly,
    // long enough to meaningfully cut down repeated database hits during
    // a busy check-in rush.
    { headers: { "Cache-Control": "public, s-maxage=8, stale-while-revalidate=20" } }
  );
}
