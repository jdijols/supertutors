import { create } from "zustand";

export type AttemptState =
  | "prompting"
  | "attempting"
  | "passing"
  | "failing"
  | "uncertain"
  | "reference-shown";

interface AslState {
  /** Index into the trained signs array */
  currentSignIdx: number;
  attemptState: AttemptState;
  hintShown: boolean;
  referenceShown: boolean;
  sessionId: string | null;

  // Actions
  setAttemptState: (state: AttemptState) => void;
  setHintShown: (shown: boolean) => void;
  setReferenceShown: (shown: boolean) => void;
  setSessionId: (id: string) => void;
  advanceSign: (totalSigns: number) => boolean; // returns true if there are more signs
  reset: () => void;
}

const initialState = {
  currentSignIdx: 0,
  attemptState: "prompting" as AttemptState,
  hintShown: false,
  referenceShown: false,
  sessionId: null as string | null,
};

export const useAslStore = create<AslState>((set, get) => ({
  ...initialState,

  setAttemptState: (attemptState) => set({ attemptState }),
  setHintShown: (hintShown) => set({ hintShown }),
  setReferenceShown: (referenceShown) => set({ referenceShown }),
  setSessionId: (sessionId) => set({ sessionId }),

  advanceSign: (totalSigns) => {
    const next = get().currentSignIdx + 1;
    if (next >= totalSigns) return false;
    set({
      currentSignIdx: next,
      attemptState: "prompting",
      hintShown: false,
      referenceShown: false,
    });
    return true;
  },

  reset: () => set(initialState),
}));
