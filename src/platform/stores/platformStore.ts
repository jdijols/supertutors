import { create } from "zustand";

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
    /* localStorage unavailable in private mode */
  }
}

interface PlatformState {
  name: string | null;
  setName: (name: string) => void;

  muted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;

  cvMode: boolean;
  setCvMode: (enabled: boolean) => void;

  currentLessonSlug: string | null;
  setCurrentLessonSlug: (slug: string | null) => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  name: null,
  setName: (name) => set({ name }),

  muted: readPersistedMuted(),
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

  cvMode: false,
  setCvMode: (cvMode) => set({ cvMode }),

  currentLessonSlug: null,
  setCurrentLessonSlug: (currentLessonSlug) => set({ currentLessonSlug }),
}));
