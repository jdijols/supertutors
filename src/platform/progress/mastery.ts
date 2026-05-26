import type { AttemptResult, MasteryStatus } from "./types";

/**
 * Items are prefixed with a stable lesson key (`asl:A`, `freddy:half`).
 * The schema also stores `lesson_slug` on the items table, but the prefix
 * is the cheapest reliable way to dispatch lesson-specific mastery rules
 * from inside `recordAttempt` without an extra DB lookup.
 */
const LESSON_BY_PREFIX: Record<string, string> = {
  asl: "asl",
  freddy: "freddy-fractions",
};

export function getLessonForItem(itemId: string): string | null {
  const prefix = itemId.split(":")[0];
  return LESSON_BY_PREFIX[prefix] ?? null;
}

/**
 * Number of recent attempts the rule engine needs. Callers should fetch
 * at least this many attempts (newest first) for any item being scored.
 */
export const MASTERY_LOOKBACK = 6;

/**
 * Compute mastery status for an item given the recent attempt history.
 *
 * Rules (locked 2026-05-26):
 * - **ASL** (`asl:*`): `mastered` if last 3 scored attempts are all
 *   `pass`, OR if at least 5 of the last 6 scored attempts are `pass`.
 * - **Freddy Fractions** (`freddy:*`): `mastered` after any single pass.
 *   Problems are discrete pass/fail, not repeated practice.
 * - **Sticky mastery**: once `mastered`, stays `mastered` regardless of
 *   subsequent fails. Subsequent attempts are still recorded in the
 *   attempts table; the badge is the only thing that doesn't downgrade.
 *   (V2 may add review surfacing without changing this rule.)
 *
 * Only `pass` and `fail` count toward rule evaluation — `skip` and
 * `uncertain` are noise (skip = deferral, uncertain = CV dropout) and
 * are filtered out before the rule runs.
 *
 * The `skip`-as-newest-attempt branch still flips the status to
 * `needs_practice` for parity with the prior implementation, which other
 * code may depend on as a "needs review" signal.
 *
 * @param itemId         e.g., `"asl:A"` or `"freddy:half"`.
 * @param recentAttempts Attempts for this item ordered NEWEST FIRST.
 *                       Pass at least `MASTERY_LOOKBACK` items — older
 *                       attempts are ignored for the sliding-window rule.
 * @param existingStatus Current mastery status, or `null` if none yet.
 */
export function computeMasteryStatus(
  itemId: string,
  recentAttempts: AttemptResult[],
  existingStatus: MasteryStatus | null,
): MasteryStatus {
  // Sticky: once mastered, stays mastered.
  if (existingStatus === "mastered") return "mastered";

  const lesson = getLessonForItem(itemId);
  const scored = recentAttempts.filter(
    (r) => r === "pass" || r === "fail",
  );

  if (lesson === "freddy-fractions") {
    if (scored.includes("pass")) return "mastered";
    return derivePracticing(recentAttempts);
  }

  if (lesson === "asl") {
    // Rule A: last 3 scored attempts are all pass
    if (
      scored.length >= 3 &&
      scored.slice(0, 3).every((r) => r === "pass")
    ) {
      return "mastered";
    }
    // Rule B: ≥5 of the last 6 scored attempts are pass
    const last6 = scored.slice(0, 6);
    if (last6.length >= 6 && last6.filter((r) => r === "pass").length >= 5) {
      return "mastered";
    }
    return derivePracticing(recentAttempts);
  }

  // Unknown lesson — fall back to "any pass = mastered" so the rule
  // never blocks a learner whose lesson hasn't been registered yet.
  if (scored.includes("pass")) return "mastered";
  return derivePracticing(recentAttempts);
}

function derivePracticing(recentAttempts: AttemptResult[]): MasteryStatus {
  if (recentAttempts.length === 0) return "not_started";
  // Newest attempt was a deliberate skip — surface as needs-practice so
  // the learner sees it again when they return.
  if (recentAttempts[0] === "skip") return "needs_practice";
  return "practicing";
}
