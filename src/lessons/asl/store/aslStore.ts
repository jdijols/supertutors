import { create } from "zustand";

export type AttemptState =
  | "prompting"
  | "attempting"
  | "passing"
  | "failing"
  | "uncertain";

/** Per-sign outcome — drives the LetterGrid's mastery indicators. */
export type SignOutcome = "attempted" | "mastered";

/** Which surface is on-screen. The camera stays mounted under all of these. */
export type ViewMode = "grid" | "practice" | "summary";

/**
 * Confusion-pair drill state. The drill alternates between two letters
 * (e.g. M and N). The user must pass `goal` times in a row across both to
 * complete the drill; on completion both letters are marked mastered.
 */
export interface DrillState {
  /** The two letter glyphs in the drill (e.g. ["M", "N"]). */
  pair: [string, string];
  /** Pre-built alternating sequence of glyphs to step through. */
  sequence: string[];
  /** Index into `sequence` — which letter we're currently prompting. */
  index: number;
  /** Consecutive passes — resets if the user skips or fails confidently. */
  correctInARow: number;
  /** Passes-in-a-row needed to complete. Default 4. */
  goal: number;
}

interface AslState {
  /** Current view in the lesson. Grid is the default entry. */
  viewMode: ViewMode;

  /** Which sign the practice loop is currently targeting (by ID). */
  currentSignId: string | null;

  /**
   * Outcome per sign ID. Absence = untouched. "attempted" = tried but skipped
   * or unrecognized. "mastered" = pass beat fired.
   */
  outcomes: Record<string, SignOutcome>;

  /** Recognizer's current top non-background prediction (for HUD-aware hints). */
  observedSignId: string | null;

  /** Active confusion-pair drill, if any. */
  drill: DrillState | null;

  attemptState: AttemptState;
  hintShown: boolean;
  sessionId: string | null;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  selectSign: (signId: string) => void;
  setOutcome: (signId: string, outcome: SignOutcome) => void;
  setObservedSignId: (id: string | null) => void;
  setAttemptState: (state: AttemptState) => void;
  setHintShown: (shown: boolean) => void;
  setSessionId: (id: string) => void;

  /** Start a drill on a letter pair. Both signs need to exist in TRAINED_SIGNS. */
  startDrill: (pair: [string, string]) => void;
  /** Called by the practice loop on pass during a drill. Returns true if drill complete. */
  advanceDrill: () => { completed: boolean };
  /** Called when the user skips/fails. Resets correctInARow and advances to the next letter. */
  drillSetback: () => void;
  /** Abort an active drill and return to the grid. */
  cancelDrill: () => void;

  reset: () => void;
}

const initialState = {
  viewMode: "grid" as ViewMode,
  currentSignId: null as string | null,
  outcomes: {} as Record<string, SignOutcome>,
  observedSignId: null as string | null,
  drill: null as DrillState | null,
  attemptState: "prompting" as AttemptState,
  hintShown: false,
  sessionId: null as string | null,
};

const DRILL_LENGTH = 8;     // 8 alternations covers the typical 4-in-a-row path
const DRILL_GOAL = 4;

function buildDrillSequence(pair: [string, string]): string[] {
  // Strict alternation A, B, A, B, … so the user can't get into a rhythm
  // by always seeing the same letter twice.
  const seq: string[] = [];
  for (let i = 0; i < DRILL_LENGTH; i++) {
    seq.push(i % 2 === 0 ? pair[0] : pair[1]);
  }
  return seq;
}

export const useAslStore = create<AslState>((set, get) => ({
  ...initialState,

  setViewMode: (viewMode) => set({ viewMode }),

  selectSign: (signId) =>
    set({
      currentSignId: signId,
      viewMode: "practice",
      attemptState: "prompting",
      hintShown: false,
      observedSignId: null,
      // Picking a single letter cancels any in-flight drill.
      drill: null,
    }),

  setOutcome: (signId, outcome) => {
    const existing = get().outcomes[signId];
    if (existing === "mastered" && outcome === "attempted") return;
    set({ outcomes: { ...get().outcomes, [signId]: outcome } });
  },

  setObservedSignId: (observedSignId) => set({ observedSignId }),
  setAttemptState: (attemptState) => set({ attemptState }),
  setHintShown: (hintShown) => set({ hintShown }),
  setSessionId: (sessionId) => set({ sessionId }),

  startDrill: (pair) => {
    const sequence = buildDrillSequence(pair);
    const firstGlyph = sequence[0];
    set({
      drill: {
        pair,
        sequence,
        index: 0,
        correctInARow: 0,
        goal: DRILL_GOAL,
      },
      currentSignId: `asl:${firstGlyph}`,
      viewMode: "practice",
      attemptState: "prompting",
      hintShown: false,
      observedSignId: null,
    });
  },

  advanceDrill: () => {
    const d = get().drill;
    if (!d) return { completed: false };
    const correctInARow = d.correctInARow + 1;
    if (correctInARow >= d.goal) {
      // Drill complete — both letters get marked mastered.
      const outcomes = { ...get().outcomes };
      outcomes[`asl:${d.pair[0]}`] = "mastered";
      outcomes[`asl:${d.pair[1]}`] = "mastered";
      set({
        drill: null,
        outcomes,
      });
      return { completed: true };
    }
    const nextIndex = (d.index + 1) % d.sequence.length;
    const nextGlyph = d.sequence[nextIndex];
    set({
      drill: { ...d, index: nextIndex, correctInARow },
      currentSignId: `asl:${nextGlyph}`,
      attemptState: "prompting",
      hintShown: false,
      observedSignId: null,
    });
    return { completed: false };
  },

  drillSetback: () => {
    const d = get().drill;
    if (!d) return;
    const nextIndex = (d.index + 1) % d.sequence.length;
    const nextGlyph = d.sequence[nextIndex];
    set({
      drill: { ...d, index: nextIndex, correctInARow: 0 },
      currentSignId: `asl:${nextGlyph}`,
      attemptState: "prompting",
      hintShown: false,
      observedSignId: null,
    });
  },

  cancelDrill: () =>
    set({
      drill: null,
      viewMode: "grid",
    }),

  reset: () => set(initialState),
}));
