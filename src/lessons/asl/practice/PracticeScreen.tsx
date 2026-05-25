import { useHandLandmarks } from "@/platform/cv/HandTracker";
import type { ProgressHandle } from "@/platform/progress/types";
import { useAslStore } from "../store/aslStore";
import { getTrainedSigns } from "../vocab";
import { ConfidenceCue } from "./ConfidenceCue";
import { HandMeshOverlay } from "./HandMeshOverlay";
import { HintCard } from "./HintCard";
import { PassBeat } from "./PassBeat";
import { PromptCard } from "./PromptCard";
import { ReferenceVideoModal } from "./ReferenceVideoModal";
import { usePracticeLoop } from "./usePracticeLoop";

interface PracticeScreenProps {
  progress?: ProgressHandle;
  onComplete: () => void;
}

/**
 * PracticeScreen — full-viewport practice surface.
 *
 * Camera feed as background, PromptCard at top, HintCard at bottom,
 * PassBeat on success, ReferenceVideoModal on demand. The practice
 * loop drives all state transitions.
 */
export function PracticeScreen({ progress, onComplete }: PracticeScreenProps) {
  const { videoRef, result, status } = useHandLandmarks();
  const trainedSigns = getTrainedSigns();

  const { recognizer } = usePracticeLoop({
    progress,
    onAllSignsCompleted: onComplete,
  });

  const currentSignIdx = useAslStore((s) => s.currentSignIdx);
  const attemptState = useAslStore((s) => s.attemptState);
  const hintShown = useAslStore((s) => s.hintShown);
  const referenceShown = useAslStore((s) => s.referenceShown);
  const setReferenceShown = useAslStore((s) => s.setReferenceShown);

  const currentSign = trainedSigns[currentSignIdx];
  if (!currentSign) return null;

  const handDetected = result && result.landmarks.length > 0;

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Camera feed — mirrored so the user sees themselves naturally */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />

      {/* Hand landmark mesh overlay */}
      <HandMeshOverlay result={result} videoRef={videoRef} />

      {/* Confidence cue at top */}
      <ConfidenceCue recognizer={recognizer} />

      {/* Loading overlay */}
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
        current={currentSignIdx + 1}
        total={trainedSigns.length}
      />

      {/* Hand detection indicator */}
      <div className="absolute bottom-32 sm:bottom-36 left-1/2 -translate-x-1/2 z-10">
        <div
          className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${handDetected ? "bg-green-400 shadow-lg shadow-green-400/50" : "bg-white/30"}
          `}
          aria-label={handDetected ? "Hand detected" : "No hand detected"}
        />
      </div>

      {/* Hint card — shown on fail/uncertain */}
      {hintShown &&
        (attemptState === "failing" || attemptState === "uncertain") && (
          <HintCard
            targetSign={currentSign}
            onShowReference={
              currentSign.referenceVideo
                ? () => setReferenceShown(true)
                : undefined
            }
          />
        )}

      {/* Pass beat — full screen celebration */}
      <PassBeat active={attemptState === "passing"} />

      {/* Reference video modal */}
      {currentSign.referenceVideo && (
        <ReferenceVideoModal
          open={referenceShown}
          videoSrc={currentSign.referenceVideo}
          signName={currentSign.glyph}
          onClose={() => setReferenceShown(false)}
        />
      )}

      {/* Demo hint — small text bottom-left showing keyboard shortcuts */}
      <div className="absolute bottom-3 left-3 z-10 font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
        Demo: P=pass · F=fail · U=uncertain
      </div>
    </div>
  );
}
