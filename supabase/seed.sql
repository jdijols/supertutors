-- Seed: items reference data
-- Run after the init migration. Safe to re-run (uses ON CONFLICT).

-- Freddy Fractions
insert into public.items (id, lesson_slug, display_name, metadata) values
  ('freddy:fractions-equivalence', 'freddy-fractions', 'Equivalent Fractions', '{}')
on conflict (id) do nothing;

-- ASL hero signs (trained subset — updated when vocab.ts is finalized in U6)
-- Placeholder set based on phonological diversity + ASL-LEX frequency/AoA curation
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
