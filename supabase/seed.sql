-- Seed: items reference data
-- Run after migrations. Safe to re-run (uses ON CONFLICT).
-- Must stay in sync with each lesson's catalog. See catalog-seed.test.ts —
-- it scans this file + migrations and fails if a catalog item is missing.

-- ─── Freddy Fractions ───────────────────────────────────────────────────────
-- Legacy lesson-level row (kept for back-compat with V2 sandbox attempts)
insert into public.items (id, lesson_slug, display_name, metadata) values
  ('freddy:fractions-equivalence', 'freddy-fractions', 'Equivalent Fractions', '{}')
on conflict (id) do nothing;

-- V3 assessment beats (catalog.ts)
insert into public.items (id, lesson_slug, display_name, metadata) values
  ('freddy:count-halves',     'freddy-fractions', 'Count the halves',   '{"order": 1}'),
  ('freddy:notation-half',    'freddy-fractions', 'Write ½',            '{"order": 2}'),
  ('freddy:name-quarter',     'freddy-fractions', 'Name the quarter',   '{"order": 3}'),
  ('freddy:count-quarters',   'freddy-fractions', 'Count the quarters', '{"order": 4}'),
  ('freddy:notation-quarter', 'freddy-fractions', 'Write ¼',            '{"order": 5}')
on conflict (id) do nothing;

-- ─── ASL — word signs (legacy trained subset) ───────────────────────────────
insert into public.items (id, lesson_slug, display_name, metadata) values
  ('asl:HELLO',    'asl', 'Hello',    '{"handshape": "B", "location": "forehead", "movement": "away", "palmOrientation": "in"}'),
  ('asl:THANK-YOU','asl', 'Thank You','{"handshape": "B", "location": "chin", "movement": "away", "palmOrientation": "in"}'),
  ('asl:YES',      'asl', 'Yes',      '{"handshape": "S", "location": "neutral", "movement": "nod", "palmOrientation": "away"}'),
  ('asl:NO',       'asl', 'No',       '{"handshape": "U+thumb", "location": "neutral", "movement": "close", "palmOrientation": "away"}'),
  ('asl:PLEASE',   'asl', 'Please',   '{"handshape": "B", "location": "chest", "movement": "circular", "palmOrientation": "in"}'),
  ('asl:SORRY',    'asl', 'Sorry',    '{"handshape": "A", "location": "chest", "movement": "circular", "palmOrientation": "in"}'),
  ('asl:HELP',     'asl', 'Help',     '{"handshape": "A-on-B", "location": "palm", "movement": "up", "palmOrientation": "up"}'),
  ('asl:FRIEND',   'asl', 'Friend',   '{"handshape": "X", "location": "neutral", "movement": "hook-link", "palmOrientation": "varied"}')
on conflict (id) do nothing;

-- ─── ASL — alphabet A–Z (trained classes the recognizer outputs) ────────────
insert into public.items (id, lesson_slug, display_name, metadata) values
  ('asl:A', 'asl', 'A', '{"kind": "letter"}'),
  ('asl:B', 'asl', 'B', '{"kind": "letter"}'),
  ('asl:C', 'asl', 'C', '{"kind": "letter"}'),
  ('asl:D', 'asl', 'D', '{"kind": "letter"}'),
  ('asl:E', 'asl', 'E', '{"kind": "letter"}'),
  ('asl:F', 'asl', 'F', '{"kind": "letter"}'),
  ('asl:G', 'asl', 'G', '{"kind": "letter"}'),
  ('asl:H', 'asl', 'H', '{"kind": "letter"}'),
  ('asl:I', 'asl', 'I', '{"kind": "letter"}'),
  ('asl:J', 'asl', 'J', '{"kind": "letter", "movement": "hook-trace"}'),
  ('asl:K', 'asl', 'K', '{"kind": "letter"}'),
  ('asl:L', 'asl', 'L', '{"kind": "letter"}'),
  ('asl:M', 'asl', 'M', '{"kind": "letter"}'),
  ('asl:N', 'asl', 'N', '{"kind": "letter"}'),
  ('asl:O', 'asl', 'O', '{"kind": "letter"}'),
  ('asl:P', 'asl', 'P', '{"kind": "letter"}'),
  ('asl:Q', 'asl', 'Q', '{"kind": "letter"}'),
  ('asl:R', 'asl', 'R', '{"kind": "letter"}'),
  ('asl:S', 'asl', 'S', '{"kind": "letter"}'),
  ('asl:T', 'asl', 'T', '{"kind": "letter"}'),
  ('asl:U', 'asl', 'U', '{"kind": "letter"}'),
  ('asl:V', 'asl', 'V', '{"kind": "letter"}'),
  ('asl:W', 'asl', 'W', '{"kind": "letter"}'),
  ('asl:X', 'asl', 'X', '{"kind": "letter"}'),
  ('asl:Y', 'asl', 'Y', '{"kind": "letter"}'),
  ('asl:Z', 'asl', 'Z', '{"kind": "letter", "movement": "z-trace"}')
on conflict (id) do nothing;
