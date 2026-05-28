-- ============================================================
-- In Light of the Word — Database Migration
-- Run this in Supabase → SQL Editor
-- ============================================================

-- ── 1. DEVOTIONALS ──────────────────────────────────────────
create table if not exists public.devotionals (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  verse            text,
  verse_reference  text,
  content          text not null,
  author_id        uuid references public.profiles(id) on delete set null,
  author_name      text,
  published_date   date not null default current_date,
  created_at       timestamptz not null default now()
);

-- Allow anyone to read devotionals; only admins can write (enforced in API)
alter table public.devotionals enable row level security;
create policy "devotionals_select" on public.devotionals for select using (true);
create policy "devotionals_insert" on public.devotionals for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );
create policy "devotionals_delete" on public.devotionals for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );

-- ── 2. SERMONS ───────────────────────────────────────────────
create table if not exists public.sermons (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  speaker      text,
  sermon_date  date,
  youtube_url  text not null,
  description  text,
  audio_url    text,       -- optional direct audio link
  added_by     uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.sermons enable row level security;
create policy "sermons_select" on public.sermons for select using (true);
create policy "sermons_insert" on public.sermons for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );
create policy "sermons_delete" on public.sermons for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );

-- ── 3. WHATSAPP SUBSCRIBERS ──────────────────────────────────
create table if not exists public.whatsapp_subscribers (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null unique,   -- E.164 format: +254712345678
  name       text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_subscribers enable row level security;
-- Only admins can read/write subscribers
create policy "wa_subs_admin" on public.whatsapp_subscribers
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );

-- ── 4. WHATSAPP BROADCAST LOG ────────────────────────────────
create table if not exists public.whatsapp_broadcasts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  message      text not null,
  link         text,
  sent_count   int not null default 0,
  failed_count int not null default 0,
  sent_by      uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.whatsapp_broadcasts enable row level security;
create policy "wa_log_admin" on public.whatsapp_broadcasts
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );
create policy "wa_log_insert" on public.whatsapp_broadcasts for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );

-- ── 5. NEWSLETTER SUBSCRIBERS (non-registered email opt-in) ──
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;
-- Anyone can subscribe (insert); only admins can read the list
create policy "newsletter_insert" on public.newsletter_subscribers
  for insert with check (true);
create policy "newsletter_admin_select" on public.newsletter_subscribers
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin','superadmin')
    )
  );

-- ── 6. COMMENT DELETE POLICY ─────────────────────────────────
-- Allow users to delete their own comments
-- (Add this only if your existing RLS doesn't already allow it)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'comments' and policyname = 'comments_delete_own'
  ) then
    execute '
      create policy "comments_delete_own" on public.comments
      for delete using (author_id = auth.uid())
    ';
  end if;
end$$;

-- ── 7. INDEX for fast sermon lookups ─────────────────────────
create index if not exists sermons_date_idx on public.sermons (sermon_date desc);
create index if not exists devotionals_date_idx on public.devotionals (published_date desc);

-- ── 8. NEWSLETTER OPT-OUT column on profiles ─────────────────
alter table public.profiles
  add column if not exists newsletter_opt_out boolean not null default false;
