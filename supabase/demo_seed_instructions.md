# Demo Account Seed

Steps to create the pre-seeded demo account that makes the dashboard
render rich on demo day.

## 1. Create the demo user via Supabase Dashboard

1. Go to **Authentication → Users** in your Supabase dashboard
2. Click **Add user → Create new user**
3. Fill in:
   - Email: `demo@supertutors.app`
   - Password: `DemoTuesday2026!` (or any memorable demo password)
   - Auto Confirm User: ✅ (yes — skips email verification)
4. Click **Create user**
5. Copy the new user's UUID (visible after creation)

## 2. Apply the seed SQL

Open the SQL Editor and run the SQL below — **replace `REPLACE_WITH_DEMO_USER_UUID` with the UUID from step 1.**

```sql
-- ============================================================
-- Demo seed: pre-fill dashboard data for the demo account
-- Replace REPLACE_WITH_DEMO_USER_UUID before running
-- ============================================================

do $$
declare
  demo_user uuid := 'REPLACE_WITH_DEMO_USER_UUID';
  asl_session_1 uuid := gen_random_uuid();
  asl_session_2 uuid := gen_random_uuid();
  asl_session_3 uuid := gen_random_uuid();
  freddy_session_1 uuid := gen_random_uuid();
  freddy_session_2 uuid := gen_random_uuid();
begin

-- Update profile display name
update public.profiles
   set display_name = 'Demo Learner'
 where id = demo_user;

-- 5 ASL sessions across 7 days
insert into public.lesson_sessions (id, user_id, lesson_slug, started_at, ended_at, outcome) values
  (asl_session_1, demo_user, 'asl', now() - interval '6 days',  now() - interval '6 days'  + interval '8 minutes', 'win'),
  (asl_session_2, demo_user, 'asl', now() - interval '3 days',  now() - interval '3 days'  + interval '12 minutes', 'win'),
  (asl_session_3, demo_user, 'asl', now() - interval '1 day',   now() - interval '1 day'   + interval '6 minutes',  'win'),
  (freddy_session_1, demo_user, 'freddy-fractions', now() - interval '5 days', now() - interval '5 days' + interval '10 minutes', 'win'),
  (freddy_session_2, demo_user, 'freddy-fractions', now() - interval '2 days', now() - interval '2 days' + interval '7 minutes',  'win');

-- ASL attempts — mix of pass/fail/uncertain across the trained signs
insert into public.attempts (user_id, session_id, item_id, result, hint_fired, reference_video_shown, created_at) values
  (demo_user, asl_session_1, 'asl:HELLO',      'pass',  false, false, now() - interval '6 days' + interval '1 minute'),
  (demo_user, asl_session_1, 'asl:HELLO',      'pass',  false, false, now() - interval '6 days' + interval '2 minutes'),
  (demo_user, asl_session_1, 'asl:THANK-YOU',  'fail',  true,  false, now() - interval '6 days' + interval '3 minutes'),
  (demo_user, asl_session_1, 'asl:THANK-YOU',  'pass',  false, false, now() - interval '6 days' + interval '4 minutes'),
  (demo_user, asl_session_1, 'asl:YES',        'pass',  false, false, now() - interval '6 days' + interval '5 minutes'),
  (demo_user, asl_session_2, 'asl:HELLO',      'pass',  false, false, now() - interval '3 days' + interval '1 minute'),
  (demo_user, asl_session_2, 'asl:NO',         'fail',  true,  true,  now() - interval '3 days' + interval '3 minutes'),
  (demo_user, asl_session_2, 'asl:NO',         'pass',  false, false, now() - interval '3 days' + interval '5 minutes'),
  (demo_user, asl_session_2, 'asl:PLEASE',     'uncertain', true, false, now() - interval '3 days' + interval '7 minutes'),
  (demo_user, asl_session_2, 'asl:PLEASE',     'pass',  false, false, now() - interval '3 days' + interval '9 minutes'),
  (demo_user, asl_session_2, 'asl:SORRY',      'pass',  false, false, now() - interval '3 days' + interval '11 minutes'),
  (demo_user, asl_session_3, 'asl:HELP',       'pass',  false, false, now() - interval '1 day' + interval '2 minutes'),
  (demo_user, asl_session_3, 'asl:FRIEND',     'pass',  false, false, now() - interval '1 day' + interval '4 minutes'),
  (demo_user, freddy_session_1, 'freddy:fractions-equivalence', 'pass', false, false, now() - interval '5 days' + interval '8 minutes'),
  (demo_user, freddy_session_2, 'freddy:fractions-equivalence', 'pass', false, false, now() - interval '2 days' + interval '6 minutes');

-- Mastery rollup — derived from the attempts above
insert into public.mastery (user_id, item_id, status, pass_count, fail_count, last_practiced_at, updated_at) values
  (demo_user, 'asl:HELLO',     'mastered',      3, 0, now() - interval '3 days', now()),
  (demo_user, 'asl:THANK-YOU', 'practicing',    1, 1, now() - interval '6 days', now()),
  (demo_user, 'asl:YES',       'practicing',    1, 0, now() - interval '6 days', now()),
  (demo_user, 'asl:NO',        'practicing',    1, 1, now() - interval '3 days', now()),
  (demo_user, 'asl:PLEASE',    'practicing',    1, 0, now() - interval '3 days', now()),
  (demo_user, 'asl:SORRY',     'practicing',    1, 0, now() - interval '3 days', now()),
  (demo_user, 'asl:HELP',      'practicing',    1, 0, now() - interval '1 day', now()),
  (demo_user, 'asl:FRIEND',    'practicing',    1, 0, now() - interval '1 day', now()),
  (demo_user, 'freddy:fractions-equivalence', 'mastered', 2, 0, now() - interval '2 days', now())
on conflict (user_id, item_id) do update set
  status = excluded.status,
  pass_count = excluded.pass_count,
  fail_count = excluded.fail_count,
  last_practiced_at = excluded.last_practiced_at,
  updated_at = excluded.updated_at;

end $$;
```

## 3. Verify

Sign in to the app as `demo@supertutors.app` and confirm:
- Dashboard hero says "Welcome back, Demo Learner."
- ASL card shows progress (8/8 attempted, 1 mastered)
- Freddy card shows progress (1/1 mastered)
- Activity feed shows ~15 recent attempts

If something looks off, you can re-run the seed (it's idempotent on
mastery via ON CONFLICT, but attempts/sessions will duplicate — delete
manually first if you re-seed).
