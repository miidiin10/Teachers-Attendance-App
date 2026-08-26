import { NextResponse } from "next/server";

// Guards /checkin so it only works when reached with the correct secret
// key in the URL - i.e. via the printed QR code, not by typing the plain
// URL from memory or a bookmark. Optional: if CHECKIN_ACCESS_KEY isn't
// set, this check is skipped entirely.
export function middleware(request) {
  const requiredKey = process.env.CHECKIN_ACCESS_KEY;
  if (!requiredKey) return NextResponse.next();

  const providedKey = request.nextUrl.searchParams.get("key");
  if (providedKey !== requiredKey) {
    return new NextResponse(
      `<!DOCTYPE html>
       <html><body style="font-family:sans-serif;text-align:center;padding-top:80px;color:#334155;">
         <h2>Please scan the QR code at the entrance to check in.</h2>
       </body></html>`,
      { status: 403, headers: { "content-type": "text/html" } }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/checkin"],
};
