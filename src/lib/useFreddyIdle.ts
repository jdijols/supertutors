import { useEffect, useRef } from "react";
import { useTutorStore, type FreddyDisplay } from "@/lessons/freddy-fractions/store/tutorStore";

const IDLE_TRIGGER_MS = 20_000;
const IDLE_DURATION_MS = 10_000;

/**
 * useFreddyIdle — character life loop.
 *
 * If Freddy hasn't visibly changed state for IDLE_TRIGGER_MS (no setFreddy
 * call from anywhere — stage swap, mouth-flip, facing turn), swap him to
 * a thinking pose facing the student for IDLE_DURATION_MS, then restore
 * the exact pose he was in before. Loops as long as he stays idle.
 *
 * Trigger is Freddy's own state, NOT user input — the kid can play freely
 * in the sandbox forever, and as long as Freddy isn't reacting to anything
 * he'll periodically look up "hmm"-ing at the kid before turning back.
 *
 * Guardrails:
 *   - `enabled=false` suspends the loop (LessonExploration passes false
 *     during scripted stages where Freddy's pose is dialogue-locked).
 *   - If `freddy.speaking` is true on a tick, treat that as activity and
 *     reset the idle clock — never overlay thinking onto a speaking pose.
 *   - The pose snapshot is captured AT TRIGGER TIME, not from `freddy`
 *     state at restore time (which is the thinking pose itself).
 *   - Outside-the-hook state changes during the 10s thinking window are
 *     detected via the watcher effect — when they happen we abandon the
 *     planned restore (the new state wins).
 */
export function useFreddyIdle({ enabled = true }: { enabled?: boolean } = {}) {
  const freddy = useTutorStore((s) => s.freddy);
  const setFreddy = useTutorStore((s) => s.setFreddy);

  // Latest freddy snapshot — kept in a ref so the tick interval can read
  // it without subscribing (and tearing down on every Freddy change).
  // Sync happens in a layout effect (not during render) so React 19's
  // react-hooks/refs rule stays happy.
  const freddyRef = useRef(freddy);
  useEffect(() => {
    freddyRef.current = freddy;
  }, [freddy]);

  // Timestamp of Freddy's last state change. Initialized lazily on mount
  // (not during render — Date.now() in useRef tripped react-hooks/purity).
  const lastChangeAtRef = useRef(0);
  useEffect(() => {
    if (lastChangeAtRef.current === 0) {
      lastChangeAtRef.current = Date.now();
    }
  }, []);

  // True while we're currently overriding to the thinking pose. Prevents
  // re-triggering on every tick during the 10s window.
  const inIdleRef = useRef(false);

  // The pose to restore when the thinking window ends. Captured at
  // trigger time; cleared (so restore is a no-op) when an external
  // setFreddy call invalidates it.
  const savedPoseRef = useRef<FreddyDisplay | null>(null);

  // Guard against the watcher reacting to our own setFreddy calls —
  // otherwise entering the thinking pose would itself reset the timer.
  const skipNextWatchRef = useRef(false);

  // Watch the freddy slice. Any change resets the timer; if it happens
  // while we're mid-thinking, it means something else took over — drop
  // the pending restore.
  useEffect(() => {
    if (skipNextWatchRef.current) {
      skipNextWatchRef.current = false;
      return;
    }
    lastChangeAtRef.current = Date.now();
    if (inIdleRef.current) {
      inIdleRef.current = false;
      savedPoseRef.current = null;
    }
  }, [freddy]);

  // Tick loop — stable interval, reads via ref, no re-mount on freddy
  // change. Polls once per second, which is plenty for a 20s threshold.
  useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      const current = freddyRef.current;

      // Speaking is an active state — reset the clock, never override.
      if (current.speaking) {
        lastChangeAtRef.current = Date.now();
        return;
      }

      // Already overriding — wait for the restore timer to finish.
      if (inIdleRef.current) return;

      if (Date.now() - lastChangeAtRef.current < IDLE_TRIGGER_MS) return;

      // Trigger: snapshot current pose, swap to thinking.
      inIdleRef.current = true;
      savedPoseRef.current = { ...current };
      skipNextWatchRef.current = true;
      setFreddy({
        facing: "student",
        gesture: "thinking",
        speaking: false,
      });

      window.setTimeout(() => {
        // Restore — but only if the pose snapshot is still valid (i.e.,
        // nothing external clobbered it during the window).
        if (savedPoseRef.current) {
          skipNextWatchRef.current = true;
          setFreddy(savedPoseRef.current);
          savedPoseRef.current = null;
        }
        inIdleRef.current = false;
        // Reset the timer so the next idle window starts from now —
        // the loop continues as long as Freddy stays inactive.
        lastChangeAtRef.current = Date.now();
      }, IDLE_DURATION_MS);
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled, setFreddy]);
}
