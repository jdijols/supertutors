import { useRef } from "react";
import { FreddyCharacter, RestaurantScene } from "@/modules/world";
import { useHoldToReset } from "@/lib/useHoldToReset";
import {
  LessonTable,
  type LessonTableHandle,
} from "@/modules/lesson/LessonTable";

/**
 * SandboxPreview — the standalone /preview/sandbox page.
 *
 * Thin shell around `<LessonTable>` for direct-link inspection of the
 * Beat 2 (Sandbox / Explore) mechanics in isolation. Renders the world
 * chrome (restaurant scene, Freddy behind the counter, hold-to-reset hit
 * area, sandbox label, reset button) and delegates the entire
 * manipulative workspace — pieces, tools, slicing, proximity, AHA, Win,
 * CV mode — to `<LessonTable>`.
 *
 * The full lesson at `/lesson` mounts the same `<LessonTable>` with
 * different chrome (onboarding overlay, Freddy reaction bubbles).
 */
export function SandboxPreview() {
  const tableRef = useRef<LessonTableHandle>(null);

  const handleReset = () => tableRef.current?.reset();

  const freddyHoldRef = useRef<HTMLDivElement>(null);
  const { isHolding: isResetting, progress: resetProgress } = useHoldToReset({
    ref: freddyHoldRef,
    onReset: handleReset,
  });

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-mozzarella-50">
      <RestaurantScene>
        <div className="absolute left-2 md:left-8 bottom-0 z-10">
          <FreddyCharacter
            pose="facing_student"
            gesture="ok"
            mouth="closed"
            className="h-[88vh] md:h-[100vh] w-auto"
          />
          <div
            ref={freddyHoldRef}
            data-testid="freddy-hold-target"
            role="button"
            aria-label="Hold to restart the lesson"
            className="absolute top-[8vh] left-[10%] w-[55%] h-[40vh] rounded-3xl cursor-pointer"
          />
        </div>
      </RestaurantScene>

      {isResetting && resetProgress > 0.25 ? (
        <div
          data-testid="reset-progress-indicator"
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-sb-ink/90 text-sb-paper-soft text-xs font-mono uppercase tracking-widest shadow-lg pointer-events-none"
        >
          Restart in {Math.max(1, Math.ceil((1 - resetProgress) * 1.5))}s
        </div>
      ) : null}

      {/* Manipulative workspace — all the real mechanics live here. */}
      <LessonTable ref={tableRef} />

      {/* Reset button bottom-left — sandbox-only chrome. The lesson page
          uses the hold-to-reset Freddy gesture instead. */}
      <div className="absolute bottom-6 left-6 z-40">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-mozzarella-50 border-2 border-terracotta-300 text-terracotta-600 font-medium shadow hover:bg-mozzarella-100 focus:outline-none focus:ring-4 focus:ring-terracotta-300"
        >
          Reset pizza
        </button>
      </div>

      {/* Page label so we know we're in the sandbox preview. */}
      <div className="absolute top-4 right-4 z-50 bg-mozzarella-50/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-terracotta-600 shadow">
        Sandbox preview · Beat 2 mechanic
      </div>
    </main>
  );
}
