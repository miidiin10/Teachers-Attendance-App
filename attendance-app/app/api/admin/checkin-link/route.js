import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function checkAdmin(req) {
  const pw = req.headers.get("x-admin-password");
  return pw && pw === process.env.ADMIN_PASSWORD;
}

// Returns the full check-in URL (with the secret key baked in, if set) -
// only to a logged-in admin, so the key is never exposed in public page
// source or the browser bundle.
export async function GET(req) {
  if (!checkAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const origin = new URL(req.url).origin;
  const key = process.env.CHECKIN_ACCESS_KEY;
  const url = key ? `${origin}/checkin?key=${encodeURIComponent(key)}` : `${origin}/checkin`;

  return NextResponse.json({ url });
}
