import type { StateValue } from "xstate";
import type { DialogueKey } from "./dialogue";

/**
 * Pure mapping from a tutorMachine state value to the DialogueKey whose
 * audio is currently playing (or just finished). Used by the lesson view
 * to render the matching bubble text without duplicating the key across
 * the machine config and the UI.
 *
 * States without an `entry: playDialogue` action (idle waits, animation
 * triggers, terminal `done`) return null so the bubble closes.
 *
 * As additional beats land via Stately, extend this map to cover their
 * dialogue-playing states.
 */

const AHA_STATE_TO_KEY: Record<string, DialogueKey | null> = {
  setup: "aha_setup",
  waiting_for_slice: null,
  wrong_slice: "aha_wrong_slice",
  stuck: "aha_stuck",
  sliced_correctly: "aha_compare_prompt",
  waiting_for_compare: null,
  not_equal: "aha_not_equal",
  stuck_compare: "aha_stuck_compare",
  aha_triggered: null,
  celebrating: "aha_reveal",
  done: null,
};

export function dialogueKeyForState(value: StateValue): DialogueKey | null {
  if (typeof value === "string") return null; // top-level beats (check/win) — TBD
  if (typeof value !== "object" || value === null) return null;
  if ("aha" in value) {
    const sub = value.aha;
    if (typeof sub !== "string") return null;
    return AHA_STATE_TO_KEY[sub] ?? null;
  }
  return null;
}
