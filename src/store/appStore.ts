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

  // Guests (populated as they arrive in beats 3+)
  guests: GuestState[];
  upsertGuest: (guest: GuestState) => void;

  // Session reset
  reset: () => void;
}

const initialState = {
  name: null as string | null,
  currentBeat: "splash" as Beat,
  toolMode: "cutter" as ToolMode,
  guests: [] as GuestState[],
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,
  setName: (name) => set({ name }),
  setCurrentBeat: (currentBeat) => set({ currentBeat }),
  setToolMode: (toolMode) => set({ toolMode }),
  upsertGuest: (guest) =>
    set((state) => ({
      guests: state.guests.some((g) => g.id === guest.id)
        ? state.guests.map((g) => (g.id === guest.id ? guest : g))
        : [...state.guests, guest],
    })),
  reset: () => set(initialState),
}));
