import { useEffect, useRef, useState } from "react";
import { audioEngine } from "@/modules/audio/AudioEngine";
import { renderLine, type DialogueKey } from "@/modules/tutor/dialogue";
import { SpeechBubble } from "@/modules/world";
import { LessonTable, type LessonTableHandle } from "./LessonTable";

/**
 * LessonExploration — Act 1 (Explore) of the 3-act demo arc.
 *
 * Mounts the manipulative workspace (`<LessonTable />`) and a thin layer
 * of Freddy reaction bubbles. The kid plays freely; Freddy stays quiet
 * during exploration and pops in on two milestone moments:
 *
 *   1. **Intro** — one discovery prompt on mount: "Pizza's right there on
 *      the counter, [Name]. Go ahead — see what you can do with it!"
 *      Auto-dismisses on the first slice (no tutorial bubbles — the kid
 *      learns by doing).
 *   2. **AHA** — when proximity detection finds an equal-area cluster
 *      (e.g. 1/2 + 1/4 + 1/4), Freddy: "Whoa, [Name]! 1/2 is the SAME
 *      as 2/4!" Uses the existing `aha_reveal` MP3.
 *   3. **Win** — when all pieces reassemble into a whole pizza, Freddy:
 *      "Bellissimo, [Name]! You put it back together — just like a real
 *      pizza chef!" Uses the new `lesson_win` MP3.
 *
 * No XState machine in this path — the proximity callbacks fire the
 * bubbles directly. The state machine in `tutorMachine.ts` is preserved
 * for Beat 6 demo-mode jumps (?beat=aha / ?beat=win) and future Act 2
 * (Instruct) / Act 3 (Check) authoring.
 */
export function LessonExploration({ name }: { name: string }) {
  const tableRef = useRef<LessonTableHandle>(null);
  const [activeBubbleKey, setActiveBubbleKey] = useState<DialogueKey | null>(
    "lesson_play_intro",
  );
  // Lock-out flag so re-firing proximity doesn't re-show a dismissed bubble.
  const ahaShownRef = useRef(false);
  const winShownRef = useRef(false);

  // Auto-play audio whenever the active bubble changes.
  useEffect(() => {
    if (!activeBubbleKey) return;
    audioEngine.play({
      dialogueKey: activeBubbleKey,
      hasNameSlot: true,
      name,
      onDone: () => {},
    });
    return () => audioEngine.stop();
  }, [activeBubbleKey, name]);

  function handleSlice() {
    // Discovery prompt closes silently the moment the kid starts playing.
    if (activeBubbleKey === "lesson_play_intro") {
      setActiveBubbleKey(null);
    }
  }

  function handleAha() {
    if (ahaShownRef.current) return;
    ahaShownRef.current = true;
    setActiveBubbleKey("aha_reveal");
  }

  function handleWin() {
    if (winShownRef.current) return;
    winShownRef.current = true;
    setActiveBubbleKey("lesson_win");
  }

  return (
    <>
      <LessonTable
        ref={tableRef}
        onSlice={handleSlice}
        onAha={handleAha}
        onWin={handleWin}
      />

      {/* Freddy speaks here. One bubble at a time — later events override
          earlier ones (intro → AHA → Win). Same positioning as the
          onboarding bubbles in LessonView so the kid's eye doesn't jump. */}
      <div className="absolute left-[20%] md:left-[26%] bottom-[35vh] md:bottom-[42vh] max-w-md z-30">
        <SpeechBubble
          open={activeBubbleKey !== null}
          speaker="Freddy"
          tailSide="top-left"
          onTap={() => setActiveBubbleKey(null)}
        >
          {activeBubbleKey
            ? renderLine(activeBubbleKey, { name })
            : null}
        </SpeechBubble>
      </div>
    </>
  );
}
