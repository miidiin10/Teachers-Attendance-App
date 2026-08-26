# Teacher Attendance

A light Next.js app: teachers scan a QR code at the door to check in, a
public leaderboard ranks who arrived earliest each day, and a monthly
leaderboard shows who's leading for the end-of-month reward (most
earliest-arrival days, tie broken by the earliest average check-in time).

## How it works

- **/checkin** - public page linked from the printed QR code. Teacher picks
  their name and enters a 4-digit PIN. The server (not the phone) stamps
  the time, so nobody can fake an earlier arrival by changing their clock.
  Each teacher can only check in once per day. If you set
  `SCHOOL_LAT`/`SCHOOL_LNG`, the phone's GPS is also checked, so check-in
  only works from the school itself (stops someone screenshotting the QR
  code and sending it to a colleague who isn't there yet).
- **/leaderboard** - public page, "Today" and "This Month" tabs.
- **/admin** - password-protected page to add/remove teachers, print the
  QR code, and see a quick log of today's check-ins. No real login system
  - just a shared password, kept light.

## 1. Set up Supabase (free tier is enough)

1. Go to supabase.com, create a project.
2. Open **SQL Editor** > New query, paste the contents of
   `supabase/schema.sql`, and run it.
3. Go to **Settings > API** and copy the **Project URL** and the
   **service_role key** (not the anon key - the service role key is used
   server-side only and must never be exposed to the browser).

## 2. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On vercel.com, "Add New Project" and import the repo.
3. In the project's **Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (pick anything - this guards the /admin page)
   - `SCHOOL_LAT` / `SCHOOL_LNG` (optional - see below)
4. Deploy. Vercel will give you a URL like `your-app.vercel.app`.
   The site runs on HTTPS automatically, which is required for camera and
   location access to work on phones.

### Optional: make /checkin only reachable via the QR code

By default, anyone who learns the `/checkin` URL can type it directly,
without ever scanning the code. To stop that:

1. Pick any long random string (e.g. generate one at
   [randomkeygen.com](https://randomkeygen.com) or just mash your keyboard).
2. Set it as `CHECKIN_ACCESS_KEY` in Vercel's environment variables, and
   redeploy.
3. Log into `/admin` - the QR code shown there now automatically bakes
   this key into the link, so it only works when scanned from that QR
   code. Visiting `/checkin` without the key shows a "please scan the QR
   code" message instead of the form.

One honest limitation: once someone scans it, the full link (key
included) appears in their phone's browser address bar, so a determined
person could still copy and forward it. This stops casual guessing/typing
of the URL, not deliberate sharing. If you ever suspect the link has
leaked, just change `CHECKIN_ACCESS_KEY` to a new value, redeploy, and
reprint the QR code from `/admin` - the old link stops working instantly.

### Optional: PIN lockout

After `PIN_LOCKOUT_ATTEMPTS` wrong PINs (default 5), a teacher is locked
out for `PIN_LOCKOUT_MINUTES` (default 10) - protects against someone
guessing a 4-digit PIN by brute force. If a teacher gets locked out
legitimately (forgot their PIN), you don't have to wait it out - go to
`/admin`, find them in the teacher list, and click "Unlock".

### Optional: restrict check-in to school hours

Set `CHECKIN_OPEN_TIME` and `CHECKIN_CLOSE_TIME` (24-hour format, Lagos
time - e.g. `05:00` and `11:00`). Outside that window, check-in is
refused entirely, regardless of PIN, location, or the QR key. Leave both
blank to allow check-in at any time.

### Branding

The Al-Asaas Schools logo is bundled at `public/logo.jpg` and shows
centered at the top of every page by default - no configuration needed.
To swap it for a different image later, either replace that file directly
in the repo, or set `NEXT_PUBLIC_LOGO_URL` to a direct image link to
override it without touching code. `NEXT_PUBLIC_SCHOOL_NAME` is used for
the image's alt text.

### Optional: lock check-ins to specific locations

You can allow check-in from more than one place - useful for multiple
buildings, a large campus where one circle doesn't cover it, or a school
with a car park teachers arrive through.

Set a single environment variable, `SCHOOL_ZONES`, to a JSON list of
locations. Each needs a name, latitude, longitude, and a radius in meters:

```
SCHOOL_ZONES=[{"name":"Main Campus","lat":6.5244,"lng":3.3792,"radius":150},{"name":"Annex","lat":6.5300,"lng":3.3800,"radius":100}]
```

To find coordinates: open Google Maps, right-click the spot, and the
lat/lng shown at the top is what you paste in.

A teacher's check-in succeeds if their phone's GPS falls inside *any* of
the listed zones. If you only need one location, you can instead set
`SCHOOL_LAT` / `SCHOOL_LNG` / `SCHOOL_RADIUS_METERS` and skip the JSON.
Leave all of these blank to disable location checking entirely.

## 3. Set up your teachers

1. Visit `your-app.vercel.app/admin`, log in with `ADMIN_PASSWORD`.
2. Add each teacher's name and a 4-digit PIN.
3. Print the QR code shown on that page and put it at the entrance -
   it points to `/checkin`.

## 4. Monthly reward

At the end of the month, open `/leaderboard` > "This Month" - the top card
shows the current leader. There's no automatic reset: each month is simply
the check-ins whose date falls in that calendar month, so last month's data
stays in the database for your records and next month starts fresh
automatically on the 1st.

## Local development

```
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```

## Notes / things you may want to extend later

- PINs are stored in plain text in the database - fine for a small internal
  tool, but don't reuse a PIN teachers use elsewhere.
- Times are always computed in Africa/Lagos time regardless of device
  timezone.
- If a teacher forgets their PIN, an admin can just remove and re-add them
  (attendance history is tied to the old record and will be deleted with
  it) - or you can add a "reset PIN" feature later if that comes up often.
