import { useHandLandmarks } from "@/platform/cv/HandTracker";
import type { ProgressHandle } from "@/platform/progress/types";
import { useAslStore } from "../store/aslStore";
import { getSignById, getTrainedSigns } from "../vocab";
import { ConfidenceCue } from "./ConfidenceCue";
import { HandMeshOverlay } from "./HandMeshOverlay";
import { HintCard } from "./HintCard";
import { PassBeat } from "./PassBeat";
import { PromptCard } from "./PromptCard";
import { RecognitionHUD } from "./RecognitionHUD";
import { SkipPill } from "./SkipPill";
import { usePracticeLoop } from "./usePracticeLoop";

interface PracticeScreenProps {
  progress?: ProgressHandle;
}

/**
 * PracticeScreen — overlay surface that practices a single letter.
 *
 * Renders on top of the live camera feed (which stays mounted by the
 * parent so we don't re-init MediaPipe when switching between grid and
 * practice modes).
 *
 * - PromptCard at top: "Sign 1 of 26: A" — current letter
 * - Hand mesh overlay on the video
 * - ConfidenceCue + RecognitionHUD diagnostics
 * - HintCard at bottom when fail/uncertain (with HUD-aware "you signed X" framing)
 * - SkipPill fades in after 10s of being stuck
 * - PassBeat full-screen celebration on pass
 */
export function PracticeScreen({ progress }: PracticeScreenProps) {
  const { result, status, videoRef } = useHandLandmarks();
  const trainedSigns = getTrainedSigns();

  const { recognizer, currentSign, canSkip, handleSkip } = usePracticeLoop({
    progress,
  });

  const attemptState = useAslStore((s) => s.attemptState);
  const hintShown = useAslStore((s) => s.hintShown);
  const observedSignId = useAslStore((s) => s.observedSignId);
  const drill = useAslStore((s) => s.drill);
  const cancelDrill = useAslStore((s) => s.cancelDrill);

  if (!currentSign) return null;

  const observedSign = observedSignId ? getSignById(observedSignId) : null;
  const handDetected = result && result.landmarks.length > 0;

  // 1-based index for the prompt card; falls back to 1 if not found.
  const currentIdx = trainedSigns.findIndex((s) => s.id === currentSign.id);
  const promptIndex = currentIdx >= 0 ? currentIdx + 1 : 1;

  return (
    <>
      {/* Hand landmark mesh overlay (the camera <video> lives in the parent) */}
      <HandMeshOverlay result={result} videoRef={videoRef} />

      {/* Confidence cue at top */}
      <ConfidenceCue recognizer={recognizer} />

      {/* Diagnostic HUD — toggle with D */}
      <RecognitionHUD recognizer={recognizer} target={currentSign} />

      {/* Loading overlay — only while camera is initializing */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <span className="font-mono text-white text-sm animate-pulse">
            Starting camera...
          </span>
        </div>
      )}

      {/* Prompt card — top center */}
      <PromptCard
        sign={currentSign}
        current={promptIndex}
        total={trainedSigns.length}
      />

      {/* Drill banner — only when a confusion-pair drill is active.
          Matches PromptCard's surface (sb-card / rounded-2xl / sb-border)
          rather than a pill chip, for consistency with the rest of the
          platform chrome. */}
      {drill && (
        <div
          data-testid="drill-banner"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 mt-20 sm:mt-24"
        >
          <div className="bg-sb-card/95 backdrop-blur-sm rounded-2xl border border-sb-border shadow-xl shadow-sb-ink/10 px-4 py-2 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-sb-muted">
              Drill
            </span>
            <span className="font-mono text-sm font-bold text-sb-ink">
              {drill.pair[0]} vs {drill.pair[1]}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-accent-deep">
              {drill.correctInARow}/{drill.goal}
            </span>
            <button
              type="button"
              onClick={cancelDrill}
              aria-label="Cancel drill"
              className="ml-1 w-6 h-6 rounded-full text-sb-muted hover:bg-sb-surface hover:text-sb-ink flex items-center justify-center text-base leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-card transition-colors duration-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Hand detection indicator */}
      <div className="absolute bottom-32 sm:bottom-36 left-1/2 -translate-x-1/2 z-10">
        <div
          className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${handDetected ? "bg-basil-400 shadow-lg shadow-basil-400/50" : "bg-white/30"}
          `}
          aria-label={handDetected ? "Hand detected" : "No hand detected"}
        />
      </div>

      {/* Hint card — shown on fail/uncertain. observedSign drives the
          "We're seeing K — for E…" comparison framing in HintCard. */}
      {hintShown &&
        (attemptState === "failing" || attemptState === "uncertain") && (
          <HintCard targetSign={currentSign} observedSign={observedSign} />
        )}

      {/* Skip pill — fades in 10s into a stuck letter */}
      <SkipPill visible={canSkip && attemptState !== "passing"} onSkip={handleSkip} />

      {/* Pass beat — full screen celebration */}
      <PassBeat active={attemptState === "passing"} />

      {/* Demo hint — small text bottom-left showing keyboard shortcuts */}
      <div className="absolute bottom-3 left-3 z-10 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
        Demo: P=pass · F=fail · U=uncertain · S=skip · D=HUD
      </div>
    </>
  );
}
