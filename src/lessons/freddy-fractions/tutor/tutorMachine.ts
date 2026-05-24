import { setup, assign } from "xstate";
import { audioEngine as defaultAudioEngine } from "@/modules/audio/AudioEngine";
import type { PlayOptions } from "@/modules/audio/AudioEngine";
import { lineHasNameSlot, type DialogueKey } from "./dialogue";

/**
 * Tutor brain — root XState v5 machine.
 *
 * This file is the runtime tutor brain. Authoring source of truth lives
 * in Stately Editor (see PRD §5). When a beat is authored / edited in
 * Stately, export the XState v5 TS and replace the corresponding sub-machine
 * here. Beat 6 (AHA — internal `aha_*` keys kept stable) is the first
 * vertical slice wired through the full audio pipeline.
 *
 * Stately URL:
 *   https://stately.ai/registry/editor/embed/ce0f4ea4-b58e-44d6-9305-afb270205f0a
 *   ?machineId=2e541cb9-eef4-4c18-8720-0f4719b24692&mode=design
 */

export type TutorEvent =
  | { type: "DIALOGUE_DONE" }
  | { type: "ANIMATION_DONE" }
  | { type: "SET_NAME"; name: string }
  | { type: "SLICED"; pieceId: string; parentFraction: string }
  | { type: "PROXIMITY"; comparison: "equal" | "not_equal" }
  | { type: "TAPPED"; pieceId: string; hasTopping: boolean }
  | { type: "DELIVERED"; pieceId: string; guestId: string }
  | { type: "RESET" }
  | { type: "WIN_DEMO" };

export interface TutorContext {
  name: string | null;
  lastDialogueKey: string | null;
}

/** Minimal contract the machine needs from the audio layer. */
export interface AudioEngineLike {
  play(opts: PlayOptions): Promise<void> | void;
  stop(): void;
}

export interface CreateTutorMachineDeps {
  /** Override the AudioEngine — used in tests so playDialogue is observable. */
  audioEngine?: AudioEngineLike;
  /** Override the name-slot detector — used in tests with synthetic keys. */
  hasNameSlot?: (key: string) => boolean;
}

/**
 * Build a tutorMachine with injected dependencies. The default export
 * (`tutorMachine`) wires the singleton AudioEngine + the real dialogue.json
 * name-slot detector. Tests build their own via this factory to observe
 * `play` calls and trigger `onDone` deterministically.
 */
export function createTutorMachine(deps: CreateTutorMachineDeps = {}) {
  const engine = deps.audioEngine ?? defaultAudioEngine;
  const hasNameSlot = deps.hasNameSlot ?? ((key: string) =>
    lineHasNameSlot(key as DialogueKey));

  return setup({
    types: {
      context: {} as TutorContext,
      events: {} as TutorEvent,
      input: {} as { name?: string | null } | undefined,
    },
    actions: {
      seedHalvedPizza: () => {
        // Beat 6 precondition guard (see PRD §5.1.1, Issue #1).
        // TODO: dispatch event to Table to place a fresh halved pizza if none exists
      },
      playDialogue: (
        { context, self },
        params: { key: string },
      ) => {
        engine.play({
          dialogueKey: params.key,
          hasNameSlot: hasNameSlot(params.key),
          name: context.name ?? undefined,
          onDone: () => self.send({ type: "DIALOGUE_DONE" }),
        });
      },
      stopDialogue: () => {
        engine.stop();
      },
      playAhaAnimation: () => {
        // TODO: trigger snap-align + glow + chime via Table + Audio
      },
      assignName: assign({
        name: ({ event }) =>
          event.type === "SET_NAME" ? event.name : null,
      }),
    },
  }).createMachine({
    id: "tutor",
    initial: "aha",
    context: ({ input }) => ({
      name: input?.name ?? null,
      lastDialogueKey: null,
    }),
    on: {
      SET_NAME: { actions: "assignName" },
      RESET: {
        target: ".aha",
        actions: "stopDialogue",
      },
      WIN_DEMO: { target: ".win", actions: "stopDialogue" },
    },
    states: {
      /**
       * Beat 6 — AHA (vertical-slice target).
       * See PRD §5.1 for the full state diagram. Internal `aha_*` keys
       * kept stable to preserve the 11 already-generated MP3s.
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
            entry: {
              type: "playDialogue",
              params: { key: "aha_compare_prompt" },
            },
            on: { DIALOGUE_DONE: "waiting_for_compare" },
          },
          waiting_for_compare: {
            after: { 30000: "stuck_compare" },
            on: {
              PROXIMITY: [
                {
                  target: "aha_triggered",
                  guard: ({ event }) => event.comparison === "equal",
                },
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

      /** Beat 7 — Check for understanding (TBD, authored in Stately). */
      check: {
        // TODO: replace with Stately export
      },
      /** Beat 8 — Win moment (TBD, authored in Stately). */
      win: {
        // TODO: replace with Stately export
      },
    },
  });
}

export const tutorMachine = createTutorMachine();

export const _internal = { assign };
