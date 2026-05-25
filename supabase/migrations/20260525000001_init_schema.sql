-- SuperTutors: Universal Item / Attempt / Mastery schema
-- Applied via Supabase Dashboard SQL Editor or `supabase db push`

-- ============================================================
-- 1. PROFILES (1:1 with auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Users can update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. ITEMS (reference data — lesson vocabulary)
-- ============================================================
create table if not exists public.items (
  id            text primary key,           -- e.g. 'asl:HELLO', 'freddy:fractions-equivalence'
  lesson_slug   text not null,
  display_name  text not null,
  metadata      jsonb default '{}'::jsonb    -- phonology, difficulty, etc.
);

alter table public.items enable row level security;

-- Public-readable, no client writes
create policy "Items are publicly readable"
  on public.items for select
  using (true);

-- ============================================================
-- 3. LESSON_SESSIONS
-- ============================================================
create table if not exists public.lesson_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_slug text not null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  outcome     text check (outcome in ('win', 'exit', 'in_progress'))
);

alter table public.lesson_sessions enable row level security;

create policy "Users can read own sessions"
  on public.lesson_sessions for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own sessions"
  on public.lesson_sessions for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own sessions"
  on public.lesson_sessions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists idx_lesson_sessions_user_started
  on public.lesson_sessions (user_id, started_at desc);

-- ============================================================
-- 4. ATTEMPTS
-- ============================================================
create table if not exists public.attempts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  session_id            uuid not null references public.lesson_sessions(id) on delete cascade,
  item_id               text not null references public.items(id),
  result                text not null check (result in ('pass', 'fail', 'uncertain', 'skip')),
  hint_fired            boolean not null default false,
  reference_video_shown boolean not null default false,
  created_at            timestamptz not null default now()
);

alter table public.attempts enable row level security;

create policy "Users can read own attempts"
  on public.attempts for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own attempts"
  on public.attempts for insert
  with check ((select auth.uid()) = user_id);

create index if not exists idx_attempts_session
  on public.attempts (session_id);

create index if not exists idx_attempts_user
  on public.attempts (user_id);

-- ============================================================
-- 5. MASTERY (composite PK: user × item)
-- ============================================================
create table if not exists public.mastery (
  user_id           uuid not null references auth.users(id) on delete cascade,
  item_id           text not null references public.items(id),
  status            text not null default 'not_started'
                      check (status in ('not_started', 'practicing', 'mastered', 'needs_practice')),
  pass_count        int not null default 0,
  fail_count        int not null default 0,
  last_practiced_at timestamptz,
  updated_at        timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.mastery enable row level security;

create policy "Users can read own mastery"
  on public.mastery for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own mastery"
  on public.mastery for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own mastery"
  on public.mastery for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
