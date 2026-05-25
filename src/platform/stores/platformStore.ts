import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

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

export type AuthStatus = "loading" | "signed-in" | "signed-out";

interface PlatformState {
  name: string | null;
  setName: (name: string) => void;

  muted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;

  currentLessonSlug: string | null;
  setCurrentLessonSlug: (slug: string | null) => void;

  // Auth slice — driven by Supabase onAuthStateChange via AuthMount
  authStatus: AuthStatus;
  session: Session | null;
  user: User | null;
  setSession: (session: Session | null) => void;
}

// CV / camera state is NOT in platformStore — it's per-lesson and lives
// on the LessonHost local state (synced to `?cv=true` URL), exposed to
// lessons via `props.platform.cv` when the lesson declares `requires.camera`.
// This keeps platform state truly cross-lesson and lesson-specific state
// in the lesson where it belongs.

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

  currentLessonSlug: null,
  setCurrentLessonSlug: (currentLessonSlug) => set({ currentLessonSlug }),

  authStatus: "loading" as AuthStatus,
  session: null,
  user: null,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      authStatus: session ? "signed-in" : "signed-out",
    }),
}));
