/**
 * Freddy Fractions item catalog — the discrete units of mastery for the
 * V3 structured curriculum. V2 (sandbox exploration) does not have
 * formal items; only V3's assessment beats produce mastery entries.
 *
 * Order is intentional — it matches V3's beat progression so a learner
 * naturally moves through the catalog top-to-bottom as they advance
 * through the lesson.
 */

export interface FreddyItem {
  /** Stable item ID matching the schema, prefixed with `freddy:`. */
  id: string;
  /** Short pill label for the by-item grid (max 2 chars). */
  label: string;
  /** Full human-readable description — surfaces as the pill tooltip. */
  description: string;
}

export const FREDDY_CATALOG: FreddyItem[] = [
  { id: "freddy:count-halves",      label: "1", description: "Count the halves" },
  { id: "freddy:notation-half",     label: "2", description: "Write ½" },
  { id: "freddy:name-quarter",      label: "3", description: "Name the quarter" },
  { id: "freddy:count-quarters",    label: "4", description: "Count the quarters" },
  { id: "freddy:notation-quarter",  label: "5", description: "Write ¼" },
];

/**
 * V3 stage → catalog item id. Used by LessonV3 to record `pass`/`fail`
 * attempts when the learner answers an assessment beat.
 */
export const V3_STAGE_TO_ITEM: Record<string, string> = {
  beat_12_mc_count: "freddy:count-halves",
  beat_19_type_one_half: "freddy:notation-half",
  beat_29_mc_quarter_name: "freddy:name-quarter",
  beat_31_mc_count_quarters: "freddy:count-quarters",
  beat_33_type_one_fourth: "freddy:notation-quarter",
};
