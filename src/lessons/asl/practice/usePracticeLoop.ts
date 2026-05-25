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

/**
 * usePracticeLoop — the per-letter practice state machine.
 *
 * The lesson is grid-driven: the user taps a letter on LetterGrid, which
 * calls selectSign(id) → viewMode 'practice'. This hook only acts while
 * viewMode === 'practice'.
 *
 * "Back to grid" is now an always-available affordance via the PromptCard
 * (tap it to return). When the user backs out without a pass, we mark the
 * letter "attempted" so the grid shows the ◐ state.
 *
 * Drill mode pipes pass → next-letter and skip-equivalents → setback.
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
  const outcomes = useAslStore((s) => s.outcomes);
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

  // ─── Pass handler ─────────────────────────────────────────────────────────
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

  /**
   * User tapped the PromptCard to return to the grid. If they haven't passed
   * this letter yet, mark it "attempted" so the grid shows ◐. In drill mode,
   * tapping back cancels the drill (handled by the store's cancelDrill via
   * the banner ×; here we just exit to grid).
   */
  const handleBackToGrid = () => {
    if (!currentSignId) {
      setViewMode("grid");
      return;
    }
    // Only mark attempted if not already mastered.
    const existing = outcomes[currentSignId];
    if (existing !== "mastered") {
      setOutcome(currentSignId, "attempted");
      if (progress && sessionId) {
        void progress.recordAttempt({
          sessionId,
          itemId: currentSignId,
          result: "uncertain",
          hintFired: false,
        });
      }
    }
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

  // ─── "Save my example" — user-correction capture for Supabase ─────────────
  const [savingExample, setSavingExample] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const handleSaveExample = async () => {
    if (!currentSignId) return;
    const recognizer = recognizerRef.current as OnnxSeqSignRecognizer | null;
    if (!recognizer) return;
    const buffer = recognizer.getCurrentBuffer?.();
    if (!buffer || !progress) {
      setSavingExample("error");
      window.setTimeout(() => setSavingExample("idle"), 2000);
      return;
    }
    const predictedGlyph = recognizer.getCurrentBestLabel?.();
    const predictedSign = predictedGlyph
      ? getTrainedSigns().find((s) => s.glyph === predictedGlyph)
      : undefined;
    setSavingExample("saving");
    try {
      await progress.saveTrainingSample({
        itemId: currentSignId,
        predictedItemId: predictedSign?.id,
        landmarks: buffer,
        source: "user-correction",
      });
      setSavingExample("saved");
      window.setTimeout(() => setSavingExample("idle"), 2500);
    } catch (err) {
      console.warn("[usePracticeLoop] saveTrainingSample failed:", err);
      setSavingExample("error");
      window.setTimeout(() => setSavingExample("idle"), 2500);
    }
  };

  // No useMemo: React 19 Strict Mode can create two recognizer instances per
  // mount. A memoized return would cache the first instance and hide the
  // second from any subscribers.
  return {
    // eslint-disable-next-line react-hooks/refs -- recognizer is a stable ref set once per mount
    recognizer: recognizerRef.current,
    currentSign,
    handleBackToGrid,
    handleSaveExample,
    savingExample,
  };
}
