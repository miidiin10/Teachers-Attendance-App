import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

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
