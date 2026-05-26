-- Seed the per-item rows referenced by lesson catalogs.
--
-- The initial seed.sql shipped a placeholder set:
--   * Freddy: a single "freddy:fractions-equivalence" item (now superseded
--     by the V3 assessment-beat catalog).
--   * ASL: 8 word signs only — none of the 26 A–Z letters.
--
-- Both catalogs are referenced by `attempts.item_id` → `items.id` (FK), so
-- every recordAttempt for a missing item fails the insert and the mastery
-- counters never advance. This migration backfills the rows. Idempotent
-- via ON CONFLICT, so reruns + local resets are safe.

-- ─── Freddy Fractions — V3 assessment beats ─────────────────────────────────
-- One row per beat the curriculum scores against. IDs and labels must stay
-- in sync with src/lessons/freddy-fractions/catalog.ts.
insert into public.items (id, lesson_slug, display_name, metadata) values
  ('freddy:count-halves',     'freddy-fractions', 'Count the halves',   '{"order": 1}'),
  ('freddy:notation-half',    'freddy-fractions', 'Write ½',            '{"order": 2}'),
  ('freddy:name-quarter',     'freddy-fractions', 'Name the quarter',   '{"order": 3}'),
  ('freddy:count-quarters',   'freddy-fractions', 'Count the quarters', '{"order": 4}'),
  ('freddy:notation-quarter', 'freddy-fractions', 'Write ¼',            '{"order": 5}')
on conflict (id) do nothing;

-- ─── ASL alphabet — A through Z ─────────────────────────────────────────────
-- Trained classes the ONNX recognizer outputs. Phonology mirrors the LETTER_
-- PHONOLOGY map in src/lessons/asl/vocab.ts; kept compact here so future
-- catalog edits to vocab.ts don't churn the SQL.
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
