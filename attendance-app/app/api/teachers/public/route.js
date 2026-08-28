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
    .select("id, name")
    .eq("active", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json(
    { teachers: sorted },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
