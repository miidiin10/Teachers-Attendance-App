-- Run this once in Supabase: Project > SQL Editor > New query > paste > Run

create extension if not exists pgcrypto;

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null,           -- 4-digit code the teacher enters at check-in
  active boolean not null default true,
  failed_attempts integer not null default 0,   -- wrong-PIN counter
  locked_until timestamptz,                      -- set when locked out
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  checkin_time timestamptz not null default now(),  -- exact server timestamp
  checkin_date date not null,                        -- Lagos calendar date, set by the app
  photo_path text,                                    -- unused, kept for backwards compatibility
  lat double precision,                               -- GPS at check-in, if geofencing is on
  lng double precision,
  device_id text,                                     -- browser-generated id, for one-device-per-day
  created_at timestamptz not null default now(),
  unique (teacher_id, checkin_date)                  -- one check-in per teacher per day
);

create index if not exists idx_attendance_date on attendance (checkin_date);

-- Stops the same device from checking in more than one distinct teacher
-- per day. Multiple NULLs are allowed by Postgres, so this is a no-op for
-- any request that didn't send a device id.
create unique index if not exists idx_unique_device_per_day
  on attendance (device_id, checkin_date)
  where device_id is not null;

-- Row Level Security stays ON. Nothing is exposed to the browser directly -
-- every read/write goes through the Next.js API routes using the service
-- role key, so no policies need to be opened up.
alter table teachers enable row level security;
alter table attendance enable row level security;
