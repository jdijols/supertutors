import { create } from "zustand";

export type ToolMode = "glove" | "cutter";

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
  guests: [] as GuestState[],
  muted: readPersistedMuted(),
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  setCurrentBeat: (currentBeat) => set({ currentBeat }),
  setToolMode: (toolMode) => set({ toolMode }),
  setCvMode: (cvMode) => set({ cvMode }),
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
