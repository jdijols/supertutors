import { setup, assign } from "xstate";

/**
 * Tutor brain — root XState v5 machine.
 *
 * This file is the runtime tutor brain. Authoring source of truth lives
 * in Stately Editor (see PRD §5). When a beat is authored / edited in
 * Stately, export the XState v5 TS and replace the corresponding sub-machine
 * here. Beat 5 (AHA) is the first vertical slice.
 *
 * Stately URL:
 *   https://stately.ai/registry/editor/embed/ce0f4ea4-b58e-44d6-9305-afb270205f0a
 *   ?machineId=2e541cb9-eef4-4c18-8720-0f4719b24692&mode=design
 */

export type TutorEvent =
  | { type: "DIALOGUE_DONE" }
  | { type: "ANIMATION_DONE" }
  | { type: "SLICED"; pieceId: string; parentFraction: string }
  | { type: "PROXIMITY"; comparison: "equal" | "not_equal" }
  | { type: "TAPPED"; pieceId: string; hasTopping: boolean }
  | { type: "DELIVERED"; pieceId: string; guestId: string }
  | { type: "RESET" };

export interface TutorContext {
  name: string | null;
  lastDialogueKey: string | null;
}

/**
 * Beat 5 (AHA) — initial skeleton matching PRD §5.1 + §5.1.1.
 * Authoring will continue in Stately; this is a placeholder so the
 * pipeline (machine → React → audio) is wireable end-to-end.
 */
export const tutorMachine = setup({
  types: {
    context: {} as TutorContext,
    events: {} as TutorEvent,
  },
  actions: {
    seedHalvedPizza: () => {
      // Beat 5 precondition guard (see PRD §5.1.1, Issue #1)
      // TODO: dispatch event to Table to place a fresh halved pizza if none exists
    },
    playDialogue: (_, _params: { key: string }) => {
      // TODO: wire to AudioEngine.play(key)
    },
    playAhaAnimation: () => {
      // TODO: trigger snap-align + glow + chime via Table + Audio
    },
  },
}).createMachine({
  id: "tutor",
  initial: "aha",
  context: {
    name: null,
    lastDialogueKey: null,
  },
  states: {
    /**
     * Beat 5 — AHA (vertical-slice target).
     * See PRD §5.1 for the full state diagram.
     */
    aha: {
      initial: "setup",
      states: {
        setup: {
          entry: [
            "seedHalvedPizza",
            { type: "playDialogue", params: { key: "aha_setup" } },
          ],
          on: { DIALOGUE_DONE: "waiting_for_slice" },
        },
        waiting_for_slice: {
          after: { 30000: "stuck" },
          on: {
            SLICED: [
              {
                target: "sliced_correctly",
                guard: ({ event }) => event.parentFraction === "1/2",
              },
              { target: "wrong_slice" },
            ],
          },
        },
        wrong_slice: {
          entry: { type: "playDialogue", params: { key: "aha_wrong_slice" } },
          on: { DIALOGUE_DONE: "waiting_for_slice" },
        },
        stuck: {
          entry: { type: "playDialogue", params: { key: "aha_stuck" } },
          on: { DIALOGUE_DONE: "waiting_for_slice" },
        },
        sliced_correctly: {
          entry: { type: "playDialogue", params: { key: "aha_compare_prompt" } },
          on: { DIALOGUE_DONE: "waiting_for_compare" },
        },
        waiting_for_compare: {
          after: { 30000: "stuck_compare" },
          on: {
            PROXIMITY: [
              { target: "aha_triggered", guard: ({ event }) => event.comparison === "equal" },
              { target: "not_equal" },
            ],
          },
        },
        not_equal: {
          entry: { type: "playDialogue", params: { key: "aha_not_equal" } },
          on: { DIALOGUE_DONE: "waiting_for_compare" },
        },
        stuck_compare: {
          entry: { type: "playDialogue", params: { key: "aha_stuck_compare" } },
          on: { DIALOGUE_DONE: "waiting_for_compare" },
        },
        aha_triggered: {
          entry: "playAhaAnimation",
          on: { ANIMATION_DONE: "celebrating" },
        },
        celebrating: {
          entry: { type: "playDialogue", params: { key: "aha_reveal" } },
          on: { DIALOGUE_DONE: "done" },
        },
        done: {
          type: "final",
        },
      },
      onDone: "check",
    },

    /** Beat 6 — Check for understanding (TBD, authored in Stately). */
    check: {
      // TODO: replace with Stately export
    },
    /** Beat 7 — Win moment (TBD, authored in Stately). */
    win: {
      // TODO: replace with Stately export
    },
  },
  on: {
    RESET: ".aha",
  },
});

export const _internal = { assign };
