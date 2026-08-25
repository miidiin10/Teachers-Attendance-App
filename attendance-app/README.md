# Teacher Attendance

A light Next.js app: teachers scan a QR code at the door to check in, a
public leaderboard ranks who arrived earliest each day, and a monthly
leaderboard shows who's leading for the end-of-month reward (most
earliest-arrival days, tie broken by the earliest average check-in time).

## How it works

- **/checkin** - public page linked from the printed QR code. Teacher picks
  their name and enters a 4-digit PIN. The server (not the phone) stamps
  the time, so nobody can fake an earlier arrival by changing their clock.
  Each teacher can only check in once per day.
- **/leaderboard** - public page, "Today" and "This Month" tabs.
- **/admin** - password-protected page to add/remove teachers and print the
  QR code. No real login system - just a shared password, kept light.

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
4. Deploy. Vercel will give you a URL like `your-app.vercel.app`.

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
