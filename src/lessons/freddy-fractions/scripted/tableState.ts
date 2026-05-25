import type {
  ProximityGroup,
  SandboxPiece,
} from "../scenes/table";

/**
 * Patterns the scripted lesson cares about. Computed from the pieces
 * array — the world is the truth, not the event history.
 *
 *   wholePizza           1 whole, nothing else
 *   twoHalves            2 halves, nothing else
 *   oneHalfTwoQuarters   the target compare state — half is visible alongside
 *                        the quarters the kid will line up to match it
 *   fourQuarters         4 quarters, nothing else (kid over-sliced; recovery)
 *   hasEighths           any 1/8 piece exists (kid went too far; nudge back)
 *   multiplePizzas       total area > 1 pizza (shouldn't happen in scripted
 *                        mode since AddPizza is hidden, but defensive)
 *   other                anything else — partial deliveries, mid-slice
 *                        transient, etc. State machine should wait.
 */
export type TablePattern =
  | "wholePizza"
  | "twoHalves"
  | "oneHalfTwoQuarters"
  | "fourQuarters"
  | "hasEighths"
  | "multiplePizzas"
  | "other";

export interface PieceBuckets {
  whole: SandboxPiece[];
  halves: SandboxPiece[];
  quarters: SandboxPiece[];
  eighths: SandboxPiece[];
}

export interface PieceCounts {
  whole: number;
  halves: number;
  quarters: number;
  eighths: number;
}

/**
 * Derived snapshot of what's on the table at any moment. Single source
 * of truth for the lesson's state machine — Freddy's dialogue and stage
 * transitions read from this, never from event history.
 *
 * Computed via `useMemo(deriveTableState(pieces, proximityGroups), [...])`
 * inside LessonTable, then handed up to LessonScripted via callback. No
 * separate state to keep in sync — recomputed whenever pieces change.
 */
export interface TableState {
  pieces: PieceBuckets;
  counts: PieceCounts;
  /** Sum of each piece's fractional area. Whole=1, half=0.5, etc. */
  totalAreaUnits: number;
  /** Rounded pizza count. Should equal 1 in normal scripted-lesson flow. */
  pizzaCount: number;
  pattern: TablePattern;
  /** Existing proximity grouping output, passed through for completeness. */
  proximityGroups: ProximityGroup[];
}

const AREA_BY_FRACTION = {
  "1": 1,
  "1/2": 0.5,
  "1/3": 1 / 3,
  "1/4": 0.25,
  "1/8": 0.125,
} as const;

/**
 * Pure function — depends only on its inputs, no React state, easy to test.
 *
 * Detection is intentionally strict: a pattern only matches when the
 * piece composition is EXACTLY what the lesson expects. Anything in-flux
 * (3 quarters + 1 half, etc.) falls through to `other` so the state
 * machine waits for a clean configuration instead of acting on a
 * transient mid-slice state.
 */
export function deriveTableState(
  pieces: SandboxPiece[],
  proximityGroups: ProximityGroup[] = [],
): TableState {
  const buckets: PieceBuckets = {
    whole: [],
    halves: [],
    quarters: [],
    eighths: [],
  };

  let totalAreaUnits = 0;

  for (const p of pieces) {
    totalAreaUnits += AREA_BY_FRACTION[p.fraction] ?? 0;
    if (p.fraction === "1") buckets.whole.push(p);
    else if (p.fraction === "1/2") buckets.halves.push(p);
    else if (p.fraction === "1/4") buckets.quarters.push(p);
    else if (p.fraction === "1/8") buckets.eighths.push(p);
    // 1/3 ignored — Freddy's lesson never slices to thirds
  }

  const counts: PieceCounts = {
    whole: buckets.whole.length,
    halves: buckets.halves.length,
    quarters: buckets.quarters.length,
    eighths: buckets.eighths.length,
  };

  const pizzaCount = Math.round(totalAreaUnits);
  const pattern = detectPattern(counts, totalAreaUnits);

  return {
    pieces: buckets,
    counts,
    totalAreaUnits,
    pizzaCount,
    pattern,
    proximityGroups,
  };
}

function detectPattern(counts: PieceCounts, totalAreaUnits: number): TablePattern {
  // Hard floor checks first.
  if (totalAreaUnits > 1.05) return "multiplePizzas";
  if (counts.eighths > 0) return "hasEighths";

  // Exact composition matches — strict.
  const { whole, halves, quarters } = counts;
  if (whole === 1 && halves === 0 && quarters === 0) return "wholePizza";
  if (whole === 0 && halves === 2 && quarters === 0) return "twoHalves";
  if (whole === 0 && halves === 1 && quarters === 2) return "oneHalfTwoQuarters";
  if (whole === 0 && halves === 0 && quarters === 4) return "fourQuarters";

  return "other";
}
