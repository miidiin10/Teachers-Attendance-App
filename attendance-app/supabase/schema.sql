-- Run this once in Supabase: Project > SQL Editor > New query > paste > Run

create extension if not exists pgcrypto;

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin text not null,           -- 4-digit code the teacher enters at check-in
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  checkin_time timestamptz not null default now(),  -- exact server timestamp
  checkin_date date not null,                        -- Lagos calendar date, set by the app
  photo_path text,                                    -- selfie taken at check-in, for audit
  lat double precision,                               -- GPS at check-in, if geofencing is on
  lng double precision,
  created_at timestamptz not null default now(),
  unique (teacher_id, checkin_date)                  -- one check-in per teacher per day
);

create index if not exists idx_attendance_date on attendance (checkin_date);

-- Row Level Security stays ON. Nothing is exposed to the browser directly -
-- every read/write goes through the Next.js API routes using the service
-- role key, so no policies need to be opened up.
alter table teachers enable row level security;
alter table attendance enable row level security;
