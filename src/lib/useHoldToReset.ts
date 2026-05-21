import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tap-and-hold gesture detector (CC.2).
 *
 * Used to attach an "press-and-hold to restart the session" gesture to
 * Freddy's avatar. The kid (or parent / Jason while testing) holds the
 * avatar for `holdMs` milliseconds and the `onReset` callback fires once.
 *
 * The hook tracks an `isHolding` state plus the elapsed-fraction so the
 * caller can render a subtle progress indicator that grows during the hold
 * — discoverable but not accidental.
 *
 * Cancels on pointerup, pointerleave, pointercancel, or unmount.
 */
export interface UseHoldToResetOptions {
  /** Element to attach the listeners to. */
  ref: RefObject<HTMLElement | null>;
  /** Fires once after a full hold. */
  onReset: () => void;
  /** Hold duration in ms before reset fires. Default 1500. */
  holdMs?: number;
}

export interface HoldState {
  /** True while a press is in progress. */
  isHolding: boolean;
  /** 0–1 elapsed fraction within the current hold (0 when idle). */
  progress: number;
}

export function useHoldToReset({
  ref,
  onReset,
  holdMs = 1500,
}: UseHoldToResetOptions): HoldState {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  // Stash the latest onReset in a ref so the listener effect doesn't re-bind
  // every time the parent's callback identity changes (which would tear
  // down the listeners mid-hold).
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onResetRef.current = onReset;
  });

  const clearAll = useCallback(() => {
    setIsHolding(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number | null = null;
    let resetTimerId: number | null = null;
    let pressStartMs = 0;

    const tick = () => {
      const elapsed = performance.now() - pressStartMs;
      const fraction = Math.min(1, elapsed / holdMs);
      setProgress(fraction);
      if (fraction < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onPointerDown = () => {
      pressStartMs = performance.now();
      setIsHolding(true);
      setProgress(0);
      rafId = requestAnimationFrame(tick);
      resetTimerId = window.setTimeout(() => {
        onResetRef.current();
        clearAll();
        resetTimerId = null;
      }, holdMs);
    };

    const cancel = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (resetTimerId !== null) {
        clearTimeout(resetTimerId);
        resetTimerId = null;
      }
      clearAll();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", cancel);
    el.addEventListener("pointerleave", cancel);
    el.addEventListener("pointercancel", cancel);

    return () => {
      cancel();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", cancel);
      el.removeEventListener("pointerleave", cancel);
      el.removeEventListener("pointercancel", cancel);
    };
  }, [ref, holdMs, clearAll]);

  return { isHolding, progress };
}
