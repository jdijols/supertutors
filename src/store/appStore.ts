// Phase 1 compatibility shim — removed at end of Phase 2.
// Re-exports split stores under the old useAppStore API so no call sites break.

export type {
  ToolMode,
  Spotlight,
  FreddyFacing,
  FreddyGestureMode,
  FreddyDisplay,
  GuestExpression,
  GuestState,
  Beat,
} from "@/lessons/freddy-fractions/store/tutorStore";

import { useTutorStore } from "@/lessons/freddy-fractions/store/tutorStore";
import { usePlatformStore } from "@/platform/stores/platformStore";

type TutorState = ReturnType<typeof useTutorStore.getState>;
type PlatformState = ReturnType<typeof usePlatformStore.getState>;
type AppState = TutorState & PlatformState;

// Both stores are subscribed so components re-render on any change to either.
export function useAppStore<T>(selector: (state: AppState) => T): T {
  const tutorState = useTutorStore();
  const platformState = usePlatformStore();
  return selector({ ...platformState, ...tutorState });
}
