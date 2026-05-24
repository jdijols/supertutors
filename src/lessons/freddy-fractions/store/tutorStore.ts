import { create } from "zustand";

export type ToolMode = "glove" | "cutter";

export type Spotlight = "toolpicker" | "add" | "delivery" | null;

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

interface TutorState {
  currentBeat: Beat;
  setCurrentBeat: (beat: Beat) => void;

  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;

  spotlight: Spotlight;
  setSpotlight: (target: Spotlight) => void;

  freddy: FreddyDisplay;
  setFreddy: (patch: Partial<FreddyDisplay>) => void;

  guests: GuestState[];
  upsertGuest: (guest: GuestState) => void;

  reset: () => void;
}

const initialState = {
  currentBeat: "splash" as Beat,
  toolMode: "cutter" as ToolMode,
  spotlight: null as Spotlight,
  freddy: {
    facing: "student",
    gesture: "ok",
    speaking: false,
  } as FreddyDisplay,
  guests: [] as GuestState[],
};

export const useTutorStore = create<TutorState>((set) => ({
  ...initialState,
  setCurrentBeat: (currentBeat) => set({ currentBeat }),
  setToolMode: (toolMode) => set({ toolMode }),
  setSpotlight: (spotlight) => set({ spotlight }),
  setFreddy: (patch) => set((state) => ({ freddy: { ...state.freddy, ...patch } })),
  upsertGuest: (guest) =>
    set((state) => ({
      guests: state.guests.some((g) => g.id === guest.id)
        ? state.guests.map((g) => (g.id === guest.id ? guest : g))
        : [...state.guests, guest],
    })),
  reset: () => set({ ...initialState }),
}));
