-- Travel Engine 25.2.8 Booking Collaboration Foundation
-- Applied to the current Supabase project on 2026-08-08.
create extension if not exists pgcrypto;

alter table public.bookings
  add column if not exists payload jsonb not null default '{}'::jsonb;

create table if not exists public.trip_booking_access (
  trip_id text primary key references public.trips(trip_id) on delete cascade,
  booking_mode text not null default 'admin' check (booking_mode in ('admin','collaborative')),
  admin_party_id text,
  access_token_hash text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trip_booking_access enable row level security;
-- No browser-readable policy is intentionally created. The booking-sync Edge Function
-- reads this configuration with the service role after validating the trip token.
