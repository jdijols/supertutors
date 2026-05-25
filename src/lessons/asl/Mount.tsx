import { useEffect } from "react";
import { HandTracker, useHandLandmarks } from "@/platform/cv/HandTracker";
import type { LessonMountProps } from "@/platform/lesson-sdk";
import { useAslStore } from "./store/aslStore";
import { CameraGate } from "./practice/CameraGate";
import { PracticeScreen } from "./practice/PracticeScreen";

/**
 * AslMount — top-level ASL lesson component.
 *
 * Wraps in HandTracker provider (MediaPipe). If camera permission is
 * denied, shows CameraGate. Otherwise mounts PracticeScreen.
 * Starts a progress session on mount when signed in.
 */
export function AslMount(props: LessonMountProps) {
  const reset = useAslStore((s) => s.reset);
  const setSessionId = useAslStore((s) => s.setSessionId);

  // Reset store on mount
  useEffect(() => {
    reset();
  }, [reset]);

  // Start a progress session when signed in
  useEffect(() => {
    if (!props.platform.progress) return;
    props.platform.progress
      .startSession("asl")
      .then(setSessionId)
      .catch(console.error);
  }, [props.platform.progress, setSessionId]);

  return (
    <HandTracker>
      <AslInner {...props} />
    </HandTracker>
  );
}

/** Inner component — must be inside HandTracker to use the context */
function AslInner(_props: LessonMountProps) {
  const { status } = useHandLandmarks();

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

  return <PracticeScreen />;
}
