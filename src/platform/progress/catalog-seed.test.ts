import { readFileSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, expect, it } from "vitest";
import { lessons } from "@/platform/registry";

/**
 * Schema-level guard: every item ID a lesson's catalog references must
 * exist as a row in `public.items` by the time migrations have run.
 * Otherwise `recordAttempt` will hit a foreign-key violation against
 * `attempts.item_id` → `items.id` and the details-view mastery counters
 * stay at zero forever (errors are swallowed by the fire-and-forget
 * `void progress.recordAttempt(...)` call sites).
 *
 * We scan `supabase/seed.sql` plus every `supabase/migrations/*.sql`
 * and union the literal `'<slug>:<item>'` ids inserted into
 * `public.items`. The union must be a superset of every catalog id.
 */
function collectSeededItemIds(): Set<string> {
  const root = resolve(__dirname, "../../..");
  const files: string[] = [];
  const seedPath = join(root, "supabase", "seed.sql");
  files.push(seedPath);

  const migrationsDir = join(root, "supabase", "migrations");
  for (const entry of readdirSync(migrationsDir)) {
    if (entry.endsWith(".sql")) files.push(join(migrationsDir, entry));
  }

  const ids = new Set<string>();
  // Match the leading "'<slug>:<item>'" literal in any items(...) insert row.
  // Slug + item are restricted to the same character class the catalogs use.
  const re = /\(\s*'([a-z0-9-]+:[A-Za-z0-9_:-]+)'\s*,/g;
  for (const path of files) {
    const sql = readFileSync(path, "utf-8");
    // Heuristic gate: only consider files that touch the items table.
    if (!/\binsert\s+into\s+public\.items\b/i.test(sql)) continue;
    for (const m of sql.matchAll(re)) ids.add(m[1]);
  }
  return ids;
}

describe("Catalog ↔ items seed parity", () => {
  const seeded = collectSeededItemIds();

  for (const lesson of lessons) {
    const catalog = lesson.meta.details?.catalog;
    if (!catalog || catalog.length === 0) continue;

    it(`lesson "${lesson.slug}" — every catalog item is seeded`, () => {
      const missing = catalog
        .map((c) => c.id)
        .filter((id) => !seeded.has(id));
      expect(missing, `Missing from public.items seed: ${missing.join(", ")}`).toEqual([]);
    });
  }
});
