import { create } from "zustand";

export type ToolMode = "glove" | "cutter";

/**
 * Which UI element Freddy is currently spotlighting during the explore-act
 * intro tour. Drives a CSS pulse + scale on the target component, and
 * (for `add`) auto-opens the AddPizzaButton's variant menu while it's
 * active. Set by `LessonExploration` as each opener sub-line begins; reset
 * to `null` when the tour completes.
 */
export type Spotlight = "toolpicker" | "add" | "delivery" | null;

/**
 * Centralized Freddy display state. Set by whichever phase currently owns
 * the narration (LessonView for onboarding, LessonExploration for the
 * explore act, future Share-the-Pizza for Act 2). Consumed by the
 * `FreddyCharacter` mounted in LessonView.
 *
 * - `facing` — `student` (the kid) or `guest` (customers). `student` is
 *   the default; `guest` is used when Freddy turns away to signal "I'm
 *   busy, you play."
 * - `gesture` — pose modifier when facing the student. `ok` is the warm
 *   welcoming wave; `neutral` is calm explaining (used during the
 *   "tap me on the shoulder" cue so the wave doesn't undercut the
 *   request); `excited` for AHA / Win; `thinking` for hmm beats.
 *   Coerced to `pointing` when facing the guest (only valid combo).
 * - `speaking` — drives the mouth swap (`open` while a line plays,
 *   `closed` otherwise). Owners flip this around each `audioEngine.play`
 *   so every line animates the mouth, not just the first one.
 */
export type FreddyFacing = "student" | "guest";
export type FreddyGestureMode = "ok" | "neutral" | "excited" | "thinking";

export interface FreddyDisplay {
  facing: FreddyFacing;
  gesture: FreddyGestureMode;
  speaking: boolean;
}

export type GuestExpression = "neutral" | "frown" | "smile";

export interface GuestState {
  id: string;
  expression: GuestExpression;
  requestedFraction: string | null;
  deliveredFraction: string | null;
}

export type Beat =
  | "splash"
  | "welcomeTour"
  | "sandbox"
  | "firstGuest"
  | "twoGuests"
  | "aha"
  | "check"
  | "win";

interface AppState {
  // Kid identity
  name: string | null;
  setName: (name: string) => void;

  // Lesson progress
  currentBeat: Beat;
  setCurrentBeat: (beat: Beat) => void;

  // Tool picker
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;

  // CV physical mode (webcam hand tracking)
  cvMode: boolean;
  setCvMode: (enabled: boolean) => void;

  // Spotlight target — drives the explore-act intro tour (pulse + scale on
  // the named UI element). Null when nothing is spotlit.
  spotlight: Spotlight;
  setSpotlight: (target: Spotlight) => void;

  // Freddy display — single source of truth for pose / gesture / mouth.
  // Owners pass a partial patch so independent axes (facing vs. speaking)
  // don't clobber each other when multiple effects fire on the same tick.
  freddy: FreddyDisplay;
  setFreddy: (patch: Partial<FreddyDisplay>) => void;

  // Guests (populated as they arrive in beats 3+)
  guests: GuestState[];
  upsertGuest: (guest: GuestState) => void;

  // Audio mute — global, persisted across sessions
  muted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;

  // Session reset
  reset: () => void;
}

const MUTED_STORAGE_KEY = "supertutors:muted";

function readPersistedMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writePersistedMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTED_STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* localStorage may be unavailable in private mode — ignore */
  }
}

const initialState = {
  name: null as string | null,
  currentBeat: "splash" as Beat,
  toolMode: "cutter" as ToolMode,
  cvMode: false,
  spotlight: null as Spotlight,
  freddy: {
    facing: "student",
    gesture: "ok",
    speaking: false,
  } as FreddyDisplay,
  guests: [] as GuestState[],
  muted: readPersistedMuted(),
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  setCurrentBeat: (currentBeat) => set({ currentBeat }),
  setToolMode: (toolMode) => set({ toolMode }),
  setCvMode: (cvMode) => set({ cvMode }),
  setSpotlight: (spotlight) => set({ spotlight }),
  setFreddy: (patch) => set((state) => ({ freddy: { ...state.freddy, ...patch } })),
  upsertGuest: (guest) =>
    set((state) => ({
      guests: state.guests.some((g) => g.id === guest.id)
        ? state.guests.map((g) => (g.id === guest.id ? guest : g))
        : [...state.guests, guest],
    })),
  toggleMute: () =>
    set((state) => {
      const next = !state.muted;
      writePersistedMuted(next);
      return { muted: next };
    }),
  setMuted: (muted) => {
    writePersistedMuted(muted);
    set({ muted });
  },
  reset: () => set({ ...initialState, muted: readPersistedMuted() }),
}));
