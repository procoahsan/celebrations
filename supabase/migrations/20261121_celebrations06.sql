-- Foundation schema for the production Supabase implementation.
create extension if not exists pgcrypto;

create type public.submission_status as enum ('new','reviewing','contacted','quoted','confirmed','closed','cancelled');
create type public.booking_status as enum ('requested','confirmed','cancelled','rescheduled');

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Celebrations06',
  contact_email text,
  phone text,
  whatsapp text,
  instagram_url text,
  location text,
  service_areas text,
  timezone text not null default 'Asia/Karachi',
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  alt_text text,
  media_type text not null check (media_type in ('image','video')),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  event_type text,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_design_submissions (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  event_type text,
  preferred_date date,
  venue text,
  guest_count integer check (guest_count > 0),
  special_requests text,
  design_version integer not null default 1,
  canvas_json jsonb not null default '{}'::jsonb,
  preview_path text,
  status public.submission_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consultation_bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Asia/Karachi',
  status public.booking_status not null default 'requested',
  google_event_id text unique,
  meet_url text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index consultation_bookings_schedule_idx on public.consultation_bookings (starts_at, ends_at) where status in ('requested','confirmed');

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  event_type text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.media_assets enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.event_design_submissions enable row level security;
alter table public.consultation_bookings enable row level security;
alter table public.contact_inquiries enable row level security;

create policy "published portfolio is publicly readable" on public.portfolio_projects for select using (published = true);
create policy "public media is publicly readable" on public.media_assets for select using (is_public = true);
-- Public form inserts must be made through validated server actions/route handlers using the service role; do not add anonymous read policies.
