-- SuperTutors: Training-sample capture for ASL classifier improvement
-- Users can save their own landmark sequences as corrections when the
-- live model mispredicts a sign they're confident they're signing.
-- Future model retraining batches incorporate these accumulated examples.

create table if not exists public.training_samples (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  item_id           text not null,                              -- e.g. 'asl:C' — the correct label
  predicted_item_id text,                                       -- what the model thought it was, e.g. 'asl:D'
  landmarks         jsonb not null,                             -- 32-frame × 126-feature buffer as number[][]
  source            text not null default 'user-correction',    -- 'user-correction' | 'session-capture' | ...
  created_at        timestamptz not null default now()
);

create index if not exists training_samples_user_id_idx
  on public.training_samples (user_id, created_at desc);

create index if not exists training_samples_item_id_idx
  on public.training_samples (item_id, created_at desc);

alter table public.training_samples enable row level security;

-- Users may only insert and read their own corrections. No update/delete.
create policy "Users insert own training samples"
  on public.training_samples for insert
  with check ((select auth.uid()) = user_id);

create policy "Users read own training samples"
  on public.training_samples for select
  using ((select auth.uid()) = user_id);

comment on table public.training_samples is
  'User-submitted landmark sequences for future ASL model retraining batches.';
