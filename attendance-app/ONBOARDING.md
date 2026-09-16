# Onboarding a new school

This app is multi-tenant: one shared codebase (this repo), with each
school getting its own isolated Vercel project + Supabase database. Code
fixes and features get pushed here once and redeployed per school;
each school's data never touches another's.

Budget ~20-30 minutes per school, most of it waiting on deploys.

## Checklist

- [ ] **Supabase project** - new project at supabase.com for this school
- [ ] **Run schema.sql** - SQL Editor > paste the full contents of
      `supabase/schema.sql` from this repo > Run. This is the *only*
      database step needed; it's kept up to date with every feature this
      app has, so there's nothing to patch afterward.
- [ ] **Copy credentials** - Settings > API > Project URL and
      `service_role` key (never the `anon` key)
- [ ] **New Vercel project** - "Add New" > "Project" > select this SAME
      GitHub repo. Name it after the school (e.g. `newschool-attendance`)
- [ ] **Framework Preset** = Next.js
- [ ] **Root Directory** = `attendance-app`
- [ ] **Environment variables** (set before first deploy):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ADMIN_PASSWORD` - unique per school
  - `CHECKIN_ACCESS_KEY` - unique long random string per school
  - `NEXT_PUBLIC_SCHOOL_NAME` - this school's actual name
  - `NEXT_PUBLIC_LOGO_URL` - **required for every school except Al-Asaas**
    (a direct image link - see "Logo" note below). Skipping this shows a
    neutral initials circle, never another school's logo.
  - Optional, only if wanted: `SCHOOL_ZONES` (geofence), `CHECKIN_OPEN_TIME`
    / `CHECKIN_CLOSE_TIME` (hours), `PIN_LOCKOUT_ATTEMPTS` /
    `PIN_LOCKOUT_MINUTES`
- [ ] **Deploy**
- [ ] **Rename the domain** - Settings > Domains > rename to something
      clean (e.g. `newschool-attendance.vercel.app`)
- [ ] **Add teachers** - log into `/admin`, add each teacher with a PIN
- [ ] **Print the QR code** - shown on `/admin` once logged in
- [ ] **Test it yourself** - scan the QR, check in, confirm it shows on
      `/leaderboard`

## Logo

The bundled `public/logo.jpg` is Al-Asaas Schools' own logo and is only
used automatically for that specific school. Every other school **must**
set `NEXT_PUBLIC_LOGO_URL` to their own hosted image (a direct image link
- test it opens as just the raw picture in a new tab, not a viewer page,
same gotcha as before with postimg.cc/Google Drive links). Without it,
that school just gets a plain initials circle instead - never Al-Asaas's
logo by accident.

## Pushing a fix/feature to all schools

1. Make the change once in this repo (upload/commit as usual)
2. In Vercel, go to each school's project > Deployments > Redeploy
   (uncheck "Use existing Build Cache" for anything database/query related)
3. Each school picks up the same fix independently - no cross-school
   data risk, since each project only talks to its own Supabase project

## Known platform quirk

Supabase queries using `.order()` on this project have shown unreliable/
truncated results (confirmed and worked around throughout this app's
routes). If you or I add new queries later, sort results in JavaScript
after fetching instead of using `.order()` in the query itself.
