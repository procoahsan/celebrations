-- Celebrations06 — experience, studio, booking and admin schema (extends 20261121_celebrations06.sql)

-- ---------- Admin role ----------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create policy "admins read admin list" on public.admin_users for select using (public.is_admin());

-- ---------- CMS content ----------
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
create policy "site content is public" on public.site_content for select using (true);
create policy "admins manage site content" on public.site_content for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Portfolio media ----------
alter table public.media_assets add column if not exists poster_path text;
alter table public.media_assets add column if not exists width integer;
alter table public.media_assets add column if not exists height integer;

create table if not exists public.portfolio_media (
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  position integer not null default 0,
  primary key (project_id, media_id)
);
alter table public.portfolio_media enable row level security;
create policy "portfolio media is public when project published" on public.portfolio_media for select
  using (exists (select 1 from public.portfolio_projects p where p.id = project_id and p.published));
create policy "admins manage portfolio media" on public.portfolio_media for all using (public.is_admin()) with check (public.is_admin());
alter table public.portfolio_projects add column if not exists position integer not null default 0;
create policy "admins manage portfolio" on public.portfolio_projects for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage media" on public.media_assets for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Celebration categories ----------
create table if not exists public.celebration_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  line text,
  description text,
  image_path text,
  tone text not null default '#1c1316',
  accent text not null default '#c8a46a',
  position integer not null default 0,
  published boolean not null default true
);
alter table public.celebration_categories enable row level security;
create policy "published categories are public" on public.celebration_categories for select using (published);
create policy "admins manage categories" on public.celebration_categories for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Studio templates ----------
create table if not exists public.studio_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  definition jsonb not null, -- StudioTemplate shape (palette, layout, arrangement, lighting …)
  position integer not null default 0,
  published boolean not null default true
);
alter table public.studio_templates enable row level security;
create policy "published templates are public" on public.studio_templates for select using (published);
create policy "admins manage templates" on public.studio_templates for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Event design submissions (extend) ----------
alter table public.event_design_submissions add column if not exists location text;
alter table public.event_design_submissions add column if not exists budget_range text;
alter table public.event_design_submissions add column if not exists concept text;
alter table public.event_design_submissions add column if not exists customizations jsonb not null default '{}'::jsonb;
alter table public.event_design_submissions add column if not exists reference_paths text[] not null default '{}';
alter table public.event_design_submissions add column if not exists admin_notes text;
create policy "admins manage submissions" on public.event_design_submissions for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Testimonials ----------
create type public.testimonial_status as enum ('pending','approved','hidden');
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  quote text not null,
  event_type text,
  source text not null default 'instagram',
  source_url text,
  source_id text unique,
  image_path text,
  status public.testimonial_status not null default 'pending',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.testimonials enable row level security;
create policy "approved testimonials are public" on public.testimonials for select using (status = 'approved');
create policy "admins manage testimonials" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Availability ----------
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_minutes integer not null default 45 check (slot_minutes between 15 and 240),
  check (end_time > start_time)
);
create table if not exists public.availability_blackouts (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  check (ends_at > starts_at)
);
alter table public.availability_rules enable row level security;
alter table public.availability_blackouts enable row level security;
create policy "admins manage rules" on public.availability_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage blackouts" on public.availability_blackouts for all using (public.is_admin()) with check (public.is_admin());

alter table public.consultation_bookings add column if not exists customer_phone text;
alter table public.consultation_bookings add column if not exists topic text;
alter table public.consultation_bookings add column if not exists notes text;
create policy "admins manage bookings" on public.consultation_bookings for all using (public.is_admin()) with check (public.is_admin());
-- Prevent double booking at the database level.
create extension if not exists btree_gist;
alter table public.consultation_bookings add constraint consultation_no_overlap
  exclude using gist (tstzrange(starts_at, ends_at) with &&) where (status in ('requested','confirmed'));

alter table public.contact_inquiries add column if not exists phone text;
alter table public.contact_inquiries add column if not exists handled boolean not null default false;
create policy "admins manage inquiries" on public.contact_inquiries for all using (public.is_admin()) with check (public.is_admin());
create policy "admins manage settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Integration tokens (encrypted at rest by the app) ----------
create table if not exists public.integration_tokens (
  provider text primary key, -- 'google' | 'instagram'
  encrypted_payload text not null,
  account_label text,
  updated_at timestamptz not null default now()
);
alter table public.integration_tokens enable row level security; -- service role only; no policies on purpose

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public) values ('portfolio', 'portfolio', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false) on conflict (id) do nothing;
create policy "portfolio files are public" on storage.objects for select using (bucket_id = 'portfolio');
create policy "admins write portfolio files" on storage.objects for all using (bucket_id = 'portfolio' and public.is_admin()) with check (bucket_id = 'portfolio' and public.is_admin());
create policy "admins read submission files" on storage.objects for select using (bucket_id = 'submissions' and public.is_admin());
