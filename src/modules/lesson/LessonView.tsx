// Phase 2 shim — wraps FreddyMount for the old /lesson router route.
// Provides platform props from platformStore + the module-level audioEngine.
// Removed in Phase 3 when LessonHost takes over.
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FreddyMount } from "@/lessons/freddy-fractions/Mount";
import { audioEngine } from "@/modules/audio/AudioEngine";
import { usePlatformStore } from "@/platform/stores/platformStore";
import type { AudioEngineHandle } from "@/platform/lesson-sdk";

export function LessonView() {
  const { name, muted, setMuted } = usePlatformStore();
  const navigate = useNavigate();

  const audioHandle: AudioEngineHandle = useMemo(
    () => ({
      play: (key, opts) =>
        new Promise<void>((resolve) => {
          audioEngine.play({
            dialogueKey: key,
            name: opts?.name,
            onSpeakingChange: opts?.onSpeakingChange,
            onDone: resolve,
          });
        }),
      preload: (key) => audioEngine.preloadDialogue(key),
      stop: () => audioEngine.stop(),
    }),
    [],
  );

  return (
    <FreddyMount
      name={name ?? ""}
      onComplete={({ outcome }) => {
        if (outcome === "exit" || outcome === "win") navigate("/");
      }}
      platform={{ audio: audioHandle, muted, setMuted }}
    />
  );
}
