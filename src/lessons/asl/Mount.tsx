import { useEffect, useRef } from "react";
import { HandTracker, useHandLandmarks } from "@/platform/cv/HandTracker";
import type { LessonMountProps } from "@/platform/lesson-sdk";
import { useAslStore } from "./store/aslStore";
import { CameraGate } from "./practice/CameraGate";
import { LetterGrid } from "./practice/LetterGrid";
import { PracticeScreen } from "./practice/PracticeScreen";
import { SessionSummary } from "./practice/SessionSummary";
import { getTrainedSigns } from "./vocab";

/**
 * AslMount — top-level ASL lesson component.
 *
 * Wraps in HandTracker provider (MediaPipe). If camera permission is
 * denied, shows CameraGate. Otherwise mounts the camera <video> + a
 * view-switching container that renders LetterGrid / PracticeScreen /
 * SessionSummary based on aslStore.viewMode. The camera stays mounted
 * across all three modes so we never re-init MediaPipe.
 */
export function AslMount(props: LessonMountProps) {
  const reset = useAslStore((s) => s.reset);
  const setSessionId = useAslStore((s) => s.setSessionId);
  const sessionId = useAslStore((s) => s.sessionId);
  // eslint-disable-next-line react-hooks/purity -- performance.now() is safe here; ref initialization is effectively synchronous on mount
  const startTimeRef = useRef<number>(performance.now());

  // Reset store on mount
  useEffect(() => {
    reset();
    startTimeRef.current = performance.now();
  }, [reset]);

  // Start a progress session when signed in
  useEffect(() => {
    if (!props.platform.progress) return;
    props.platform.progress
      .startSession("asl")
      .then(setSessionId)
      .catch(console.error);
  }, [props.platform.progress, setSessionId]);

  const handleExit = () => {
    if (props.platform.progress && sessionId) {
      void props.platform.progress.endSession(sessionId, "win");
    }
    const durationMs = performance.now() - startTimeRef.current;
    props.onComplete({ outcome: "win", durationMs });
  };

  return (
    <HandTracker>
      <AslInner
        progress={props.platform.progress}
        onExit={handleExit}
      />
    </HandTracker>
  );
}

interface AslInnerProps {
  progress?: LessonMountProps["platform"]["progress"];
  onExit: () => void;
}

/** Inner component — must be inside HandTracker to use the context. */
function AslInner({ progress, onExit }: AslInnerProps) {
  const { status, videoRef } = useHandLandmarks();
  const viewMode = useAslStore((s) => s.viewMode);
  const outcomes = useAslStore((s) => s.outcomes);
  const setViewMode = useAslStore((s) => s.setViewMode);

  // Auto-trigger summary when the user has touched all letters
  useEffect(() => {
    const letters = getTrainedSigns().filter((s) => /^[A-Z]$/.test(s.glyph));
    const allTouched = letters.every((l) => outcomes[l.id]);
    if (allTouched && letters.length > 0 && viewMode === "grid") {
      setViewMode("summary");
    }
  }, [outcomes, viewMode, setViewMode]);

  if (status === "error") {
    return (
      <CameraGate
        onRetry={() => {
          // Full reload to re-trigger camera permission
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
      {/* Camera feed — always mounted so MediaPipe stays warm. Mirrored
          so the user sees themselves naturally. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
      />

      {/* View switcher — overlays on top of the camera */}
      {viewMode === "practice" && <PracticeScreen progress={progress} />}
      {viewMode === "grid" && (
        <LetterGrid onEndSession={() => setViewMode("summary")} />
      )}
      {viewMode === "summary" && <SessionSummary onExit={onExit} />}
    </div>
  );
}
