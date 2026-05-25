import { useEffect, useRef, useState } from "react";
import { useHandLandmarks } from "@/platform/cv/HandTracker";
import type { ProgressHandle } from "@/platform/progress/types";
import { useAslStore } from "../store/aslStore";
import { getSignById, getTrainedSigns } from "../vocab";
import { OnnxSeqSignRecognizer } from "./OnnxSeqSignRecognizer";
import type { SignRecognizer } from "./SignRecognizer";

interface UsePracticeLoopOpts {
  progress?: ProgressHandle;
}

/** Milliseconds the user can be stuck on a sign before the skip pill appears. */
const SKIP_AVAILABLE_AFTER_MS = 10_000;

/**
 * usePracticeLoop — the per-letter practice state machine.
 *
 * The lesson is now grid-driven: the user taps a letter on LetterGrid,
 * which calls selectSign(id) → viewMode 'practice'. This hook only acts
 * while viewMode === 'practice'. On pass/skip we update the outcome and
 * return to the grid.
 *
 * Skip becomes available 10s after the user lands on a letter. Both pass
 * and skip route back to grid; the grid is the "what's left" dashboard.
 */
export function usePracticeLoop(opts: UsePracticeLoopOpts = {}) {
  const { progress } = opts;
  const { result } = useHandLandmarks();

  const viewMode = useAslStore((s) => s.viewMode);
  const currentSignId = useAslStore((s) => s.currentSignId);
  const attemptState = useAslStore((s) => s.attemptState);
  const sessionId = useAslStore((s) => s.sessionId);
  const drill = useAslStore((s) => s.drill);
  const setViewMode = useAslStore((s) => s.setViewMode);
  const setAttemptState = useAslStore((s) => s.setAttemptState);
  const setHintShown = useAslStore((s) => s.setHintShown);
  const setOutcome = useAslStore((s) => s.setOutcome);
  const setObservedSignId = useAslStore((s) => s.setObservedSignId);
  const advanceDrill = useAslStore((s) => s.advanceDrill);
  const drillSetback = useAslStore((s) => s.drillSetback);

  // ─── Recognizer (long-lived; created once per mount) ──────────────────────
  const recognizerRef = useRef<SignRecognizer | null>(null);
  if (recognizerRef.current === null) {
    recognizerRef.current = new OnnxSeqSignRecognizer();
  }

  useEffect(() => {
    return () => {
      recognizerRef.current?.dispose();
      recognizerRef.current = null;
    };
  }, []);

  // Reset recognizer state when the targeted sign changes.
  useEffect(() => {
    recognizerRef.current?.reset();
  }, [currentSignId]);

  // ─── Skip availability (10s on the same letter) ───────────────────────────
  const [canSkip, setCanSkip] = useState(false);
  useEffect(() => {
    setCanSkip(false);
    if (viewMode !== "practice" || !currentSignId) return;
    const id = window.setTimeout(() => setCanSkip(true), SKIP_AVAILABLE_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [viewMode, currentSignId]);

  // ─── Pass / fail / uncertain handlers (skip is exposed separately) ────────
  const handlePass = (confidence: number) => {
    if (!currentSignId) return;
    setAttemptState("passing");
    setOutcome(currentSignId, "mastered");
    if (progress && sessionId) {
      void progress.recordAttempt({
        sessionId,
        itemId: currentSignId,
        result: "pass",
      });
    }
    // Drill mode: pass beat plays, then advance (or complete and return to grid).
    if (drill) {
      window.setTimeout(() => {
        const { completed } = advanceDrill();
        if (completed) setViewMode("grid");
      }, 1500);
    } else {
      // Single-letter practice: pass beat plays, then back to grid.
      window.setTimeout(() => {
        setViewMode("grid");
      }, 1500);
    }
    void confidence;
  };

  const handleSkip = () => {
    if (!currentSignId) return;
    setOutcome(currentSignId, "attempted");
    if (progress && sessionId) {
      void progress.recordAttempt({
        sessionId,
        itemId: currentSignId,
        result: "uncertain",
        hintFired: true,
      });
    }
    // Drill mode: setback resets correctInARow and advances to the other letter
    // instead of bailing back to the grid.
    if (drill) {
      drillSetback();
    } else {
      setViewMode("grid");
    }
  };

  // ─── Main observation loop ────────────────────────────────────────────────
  useEffect(() => {
    if (viewMode !== "practice") return;
    const recognizer = recognizerRef.current;
    if (!recognizer) return;
    if (!currentSignId) return;

    const currentSign = getSignById(currentSignId);
    if (!currentSign) return;

    // Don't process while in the celebratory transition.
    if (attemptState === "passing") return;

    const observation = recognizer.observe(currentSign, result?.landmarks ?? null);
    if (!observation) return;

    switch (observation.kind) {
      case "no_hand":
        if (attemptState === "attempting") setAttemptState("prompting");
        break;

      case "pass":
        handlePass(observation.confidence);
        break;

      case "fail": {
        setAttemptState("failing");
        setHintShown(true);
        // Record the observed sign for the HUD-aware hint card.
        const debug = (recognizer as OnnxSeqSignRecognizer).getDebugInfo?.();
        if (debug && debug.status === "ready" && debug.labels.length) {
          const bgIdx = debug.labels.indexOf("BACKGROUND");
          let bestIdx = -1;
          let bestProb = 0;
          for (let i = 0; i < debug.probs.length; i++) {
            if (i === bgIdx) continue;
            if (debug.probs[i] > bestProb) {
              bestProb = debug.probs[i];
              bestIdx = i;
            }
          }
          if (bestIdx >= 0) {
            const label = debug.labels[bestIdx];
            const observed = getTrainedSigns().find((s) => s.glyph === label);
            setObservedSignId(observed?.id ?? null);
          }
        }
        if (progress && sessionId) {
          void progress.recordAttempt({
            sessionId,
            itemId: currentSignId,
            result: "fail",
            hintFired: true,
          });
        }
        break;
      }

      case "uncertain":
        setAttemptState("uncertain");
        setHintShown(true);
        if (progress && sessionId) {
          void progress.recordAttempt({
            sessionId,
            itemId: currentSignId,
            result: "uncertain",
            hintFired: true,
          });
        }
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, viewMode, currentSignId, attemptState, sessionId, progress]);

  // ─── Promote 'prompting' → 'attempting' once a hand is visible ────────────
  useEffect(() => {
    if (viewMode !== "practice") return;
    const handVisible = (result?.landmarks?.length ?? 0) > 0;
    if (handVisible && attemptState === "prompting") {
      setAttemptState("attempting");
    }
  }, [result, viewMode, attemptState, setAttemptState]);

  const currentSign = currentSignId ? getSignById(currentSignId) : undefined;

  // No useMemo: React 19 Strict Mode can create two recognizer instances per
  // mount. A memoized return would cache the first instance and hide the
  // second from any subscribers.
  return {
    // eslint-disable-next-line react-hooks/refs -- recognizer is a stable ref set once per mount
    recognizer: recognizerRef.current,
    currentSign,
    canSkip,
    handleSkip,
  };
}
