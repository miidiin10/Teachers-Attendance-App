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
  const { data, error } = await supabaseAdmin
    .from("teachers")
    .select("id, name")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ teachers: data });
}
