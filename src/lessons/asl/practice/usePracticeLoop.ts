import { useEffect, useMemo, useRef } from "react";
import { useHandLandmarks } from "@/platform/cv/HandTracker";
import type { ProgressHandle } from "@/platform/progress/types";
import { useAslStore } from "../store/aslStore";
import { getTrainedSigns } from "../vocab";
import { OnnxSeqSignRecognizer } from "./OnnxSeqSignRecognizer";
import type { SignRecognizer } from "./SignRecognizer";

interface UsePracticeLoopOpts {
  progress?: ProgressHandle;
  onAllSignsCompleted?: () => void;
}

/**
 * usePracticeLoop — the practice state machine.
 *
 * Reads landmarks from HandTracker, runs them through SignRecognizer,
 * transitions aslStore state, and writes attempts to platform.progress.
 *
 * State-driven (per Freddy's pattern): transitions are derived from
 * the recognizer's output rather than event counters.
 */
export function usePracticeLoop(opts: UsePracticeLoopOpts = {}) {
  const { progress, onAllSignsCompleted } = opts;
  const { result } = useHandLandmarks();

  const trainedSigns = getTrainedSigns();
  const currentSignIdx = useAslStore((s) => s.currentSignIdx);
  const attemptState = useAslStore((s) => s.attemptState);
  const sessionId = useAslStore((s) => s.sessionId);
  const setAttemptState = useAslStore((s) => s.setAttemptState);
  const setHintShown = useAslStore((s) => s.setHintShown);
  const advanceSign = useAslStore((s) => s.advanceSign);

  // Long-lived recognizer instance
  const recognizerRef = useRef<SignRecognizer | null>(null);
  if (recognizerRef.current === null) {
    recognizerRef.current = new OnnxSeqSignRecognizer();
  }

  // Cleanup recognizer on unmount
  useEffect(() => {
    return () => {
      recognizerRef.current?.dispose();
      recognizerRef.current = null;
    };
  }, []);

  // Reset recognizer when advancing to a new sign
  useEffect(() => {
    recognizerRef.current?.reset();
  }, [currentSignIdx]);

  // Main observation loop — runs every time landmarks change (~30fps)
  useEffect(() => {
    const recognizer = recognizerRef.current;
    if (!recognizer) return;

    const currentSign = trainedSigns[currentSignIdx];
    if (!currentSign) return;

    // Don't process while in transition states
    if (attemptState === "passing" || attemptState === "reference-shown") return;

    const observation = recognizer.observe(currentSign, result?.landmarks ?? null);
    if (!observation) return;

    switch (observation.kind) {
      case "no_hand":
        // Reset to prompting if we were mid-attempt
        if (attemptState === "attempting") {
          setAttemptState("prompting");
        }
        break;

      case "pass": {
        setAttemptState("passing");
        if (progress && sessionId) {
          void progress.recordAttempt({
            sessionId,
            itemId: currentSign.id,
            result: "pass",
          });
        }
        // Advance after pass beat completes
        setTimeout(() => {
          const hasMore = advanceSign(trainedSigns.length);
          if (!hasMore && onAllSignsCompleted) {
            onAllSignsCompleted();
          }
        }, 1500);
        break;
      }

      case "fail": {
        setAttemptState("failing");
        setHintShown(true);
        if (progress && sessionId) {
          void progress.recordAttempt({
            sessionId,
            itemId: currentSign.id,
            result: "fail",
            hintFired: true,
          });
        }
        break;
      }

      case "uncertain": {
        setAttemptState("uncertain");
        setHintShown(true);
        if (progress && sessionId) {
          void progress.recordAttempt({
            sessionId,
            itemId: currentSign.id,
            result: "uncertain",
            hintFired: true,
          });
        }
        break;
      }
    }
  }, [
    result,
    currentSignIdx,
    attemptState,
    sessionId,
    progress,
    trainedSigns,
    setAttemptState,
    setHintShown,
    advanceSign,
    onAllSignsCompleted,
  ]);

  // Switch to attempting state once hand is detected (used by ConfidenceCue)
  useEffect(() => {
    const handVisible = (result?.landmarks?.length ?? 0) > 0;
    if (handVisible && attemptState === "prompting") {
      setAttemptState("attempting");
    }
  }, [result, attemptState, setAttemptState]);

  return useMemo(
    () => ({
      recognizer: recognizerRef.current,
      currentSign: trainedSigns[currentSignIdx],
    }),
    [currentSignIdx, trainedSigns]
  );
}
