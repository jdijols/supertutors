import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "@/modules/audio/AudioEngine";
import { useFreddyIdle } from "@/lib/useFreddyIdle";
import { renderLine, type DialogueKey } from "@/modules/tutor/dialogue";
import { SpeechBubble } from "@/modules/world";
import { useAppStore, type FreddyDisplay } from "@/store/appStore";
import { LessonTable, type LessonTableHandle, type LessonTableSliceEvent } from "./LessonTable";
import { AhaAnimation } from "./AhaAnimation";
import { WinConfetti } from "./WinConfetti";

/**
 * LessonScripted — Act 2 of the 3-act demo arc: "Share the Pizza".
 *
 * Mounts after LessonExploration's onComplete fires. Owns its own LessonTable
 * (fresh pizza) and drives a scripted lesson on fraction equivalence (1/2 = 2/4)
 * through a local state machine. Audio maps to existing keys where available;
 * new lesson_intro / lesson_react_halves have generated audio.
 *
 * Arc:
 *   intro → wait_halves → react_halves → wait_quarters → react_quarters →
 *   compare_prompt → wait_compare → aha_animating → reveal → win → done
 */

export interface LessonScriptedProps {
  name: string;
}

type Stage =
  | "intro"
  | "wait_halves"
  | "stuck_halves"
  | "wrong_eighths_h"
  | "react_halves"
  | "wait_quarters"
  | "stuck_quarters"
  | "wrong_eighths_q"
  | "react_quarters"
  | "compare_prompt"
  | "wait_compare"
  | "not_equal"
  | "stuck_compare"
  | "aha_animating"
  | "reveal"
  | "win"
  | "done";

const KEY_BY_STAGE: Partial<Record<Stage, DialogueKey>> = {
  intro: "lesson_intro",
  stuck_halves: "aha_stuck",
  wrong_eighths_h: "aha_wrong_slice",
  react_halves: "lesson_react_halves",
  stuck_quarters: "aha_stuck",
  wrong_eighths_q: "aha_wrong_slice",
  react_quarters: "react_quarters",
  compare_prompt: "aha_compare_prompt",
  not_equal: "aha_not_equal",
  stuck_compare: "aha_stuck_compare",
  reveal: "aha_reveal",
  win: "lesson_win",
};

const NEXT_AFTER_DONE: Partial<Record<Stage, Stage>> = {
  intro: "wait_halves",
  stuck_halves: "wait_halves",
  wrong_eighths_h: "wait_halves",
  react_halves: "wait_quarters",
  stuck_quarters: "wait_quarters",
  wrong_eighths_q: "wait_quarters",
  react_quarters: "compare_prompt",
  compare_prompt: "wait_compare",
  not_equal: "wait_compare",
  stuck_compare: "wait_compare",
  reveal: "win",
  win: "done",
};

const FREDDY_BY_STAGE: Partial<
  Record<Stage, Pick<FreddyDisplay, "facing" | "gesture">>
> = {
  intro: { facing: "student", gesture: "neutral" },
  wait_halves: { facing: "student", gesture: "neutral" },
  stuck_halves: { facing: "student", gesture: "neutral" },
  wrong_eighths_h: { facing: "student", gesture: "neutral" },
  react_halves: { facing: "student", gesture: "excited" },
  wait_quarters: { facing: "student", gesture: "neutral" },
  stuck_quarters: { facing: "student", gesture: "neutral" },
  wrong_eighths_q: { facing: "student", gesture: "neutral" },
  react_quarters: { facing: "student", gesture: "excited" },
  compare_prompt: { facing: "student", gesture: "neutral" },
  wait_compare: { facing: "student", gesture: "neutral" },
  not_equal: { facing: "student", gesture: "neutral" },
  stuck_compare: { facing: "student", gesture: "neutral" },
  aha_animating: { facing: "student", gesture: "excited" },
  reveal: { facing: "student", gesture: "excited" },
  win: { facing: "student", gesture: "ok" },
  done: { facing: "student", gesture: "ok" },
};

const STUCK_DELAY_MS = 30_000;

export function LessonScripted({ name }: LessonScriptedProps) {
  const setFreddy = useAppStore((s) => s.setFreddy);
  const setSpotlight = useAppStore((s) => s.setSpotlight);

  const [stage, setStage] = useState<Stage>("intro");
  const [activeBubble, setActiveBubble] = useState<DialogueKey | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ahaActive, setAhaActive] = useState(false);
  const [winActive, setWinActive] = useState(false);

  // Ref to LessonTable so we can reset its internal AHA lock on stage entry.
  const tableRef = useRef<LessonTableHandle>(null);
  // Count how many "1/4" slices have been made in wait_quarters.
  // A fresh pizza sliced to halves then each half to quarters = 2 events.
  const quarterSliceCount = useRef(0);
  // Guard: AHA fires only once per lesson run.
  const ahaFiredRef = useRef(false);

  useFreddyIdle({ enabled: stage === "wait_halves" || stage === "wait_quarters" || stage === "wait_compare" });

  // On mount: clear spotlight, warm up audio.
  useEffect(() => {
    setSpotlight(null);
    audioEngine.preloadDialogue("lesson_intro");
    audioEngine.preloadDialogue("lesson_react_halves");
    audioEngine.preloadDialogue("aha_compare_prompt");
    audioEngine.preloadDialogue("aha_reveal");
    audioEngine.preloadDialogue("lesson_win");
  }, [setSpotlight]);

  // Freddy pose per stage.
  useEffect(() => {
    const pose = FREDDY_BY_STAGE[stage];
    if (pose) setFreddy(pose);
  }, [stage, setFreddy]);

  // Mirror speaking state into store so FreddyCharacter mouth animates.
  useEffect(() => {
    setFreddy({ speaking: isSpeaking });
  }, [isSpeaking, setFreddy]);

  // Drive bubble from stage.
  useEffect(() => {
    const key = KEY_BY_STAGE[stage];
    if (!key) {
      setActiveBubble(null);
      return;
    }
    setActiveBubble(key);
  }, [stage]);

  // Audio playback — fires when activeBubble changes.
  useEffect(() => {
    if (!activeBubble) {
      setIsSpeaking(false);
      return;
    }
    const key = activeBubble;
    const currentStage = stage;
    audioEngine.play({
      dialogueKey: key,
      name,
      onSpeakingChange: setIsSpeaking,
      onDone: () => {
        setIsSpeaking(false);
        const next = NEXT_AFTER_DONE[currentStage];
        if (next) setStage(next);
        else setActiveBubble(null);
      },
    });
    return () => {
      audioEngine.stop();
      setIsSpeaking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBubble, name]);

  // Stuck timer for wait_halves — fires after STUCK_DELAY_MS of inaction.
  useEffect(() => {
    if (stage !== "wait_halves") return;
    const t = setTimeout(() => {
      setStage((s) => (s === "wait_halves" ? "stuck_halves" : s));
    }, STUCK_DELAY_MS);
    return () => clearTimeout(t);
  }, [stage]);

  // Stuck timer for wait_quarters.
  useEffect(() => {
    if (stage !== "wait_quarters") return;
    const t = setTimeout(() => {
      setStage((s) => (s === "wait_quarters" ? "stuck_quarters" : s));
    }, STUCK_DELAY_MS);
    return () => clearTimeout(t);
  }, [stage]);

  // Stuck timer for wait_compare.
  useEffect(() => {
    if (stage !== "wait_compare") return;
    const t = setTimeout(() => {
      setStage((s) => (s === "wait_compare" ? "stuck_compare" : s));
    }, STUCK_DELAY_MS);
    return () => clearTimeout(t);
  }, [stage]);

  // Reset LessonTable's AHA lock whenever we enter wait_compare so that
  // pieces dragged close before the stage was ready can still fire onAha.
  useEffect(() => {
    if (stage === "wait_compare") {
      tableRef.current?.resetAhaLock();
    }
  }, [stage]);

  const handleSlice = useCallback(
    (event: LessonTableSliceEvent) => {
      const { childrenFraction } = event;

      if (stage === "wait_halves") {
        if (childrenFraction === "1/2") {
          setStage("react_halves");
        } else if (childrenFraction === "1/8") {
          // Already cut too small — nudge.
          setStage("wrong_eighths_h");
        }
        // "1/4" isn't reachable from a whole pizza — ignore.
        return;
      }

      if (stage === "wait_quarters") {
        if (childrenFraction === "1/4") {
          quarterSliceCount.current += 1;
          if (quarterSliceCount.current >= 2) {
            setStage("react_quarters");
          }
          // First quarter slice: stay in wait_quarters, reset stuck timer via stage re-enter.
        } else if (childrenFraction === "1/8") {
          setStage("wrong_eighths_q");
        }
        return;
      }
    },
    [stage],
  );

  const handleAha = useCallback(() => {
    if (stage !== "wait_compare") return;
    if (ahaFiredRef.current) return;
    ahaFiredRef.current = true;
    audioEngine.stop();
    setActiveBubble(null);
    setAhaActive(true);
    setStage("aha_animating");
  }, [stage]);

  // AhaAnimation onDone → advance to reveal.
  function handleAhaDone() {
    setAhaActive(false);
    setStage("reveal");
  }

  // WinConfetti starts when stage becomes "win" and the win line plays.
  // We fire WinConfetti during the win dialogue so the celebration overlays the voice.
  useEffect(() => {
    if (stage === "win") {
      setWinActive(true);
    }
    if (stage === "done") {
      // confetti already auto-dismissed via onDone
    }
  }, [stage]);

  // Clear stage-specific spotlight when entering compare beat.
  useEffect(() => {
    if (stage === "compare_prompt" || stage === "wait_compare") {
      setSpotlight(null);
    }
  }, [stage, setSpotlight]);

  return (
    <>
      <LessonTable
        ref={tableRef}
        renderHeroAnimations={false}
        onSlice={handleSlice}
        onAha={handleAha}
      />

      {/* Speech bubble — top-aligned matching LessonExploration position. */}
      <div className="absolute top-4 sm:top-6 left-[35%] max-w-md z-30">
        <SpeechBubble
          open={activeBubble !== null && stage !== "aha_animating" && stage !== "done"}
          speaker="Freddy"
          tailSide="bottom-left"
        >
          {activeBubble ? renderLine(activeBubble, { name }) : null}
        </SpeechBubble>
      </div>

      <AhaAnimation
        active={ahaActive}
        onDone={handleAhaDone}
        durationMs={1500}
      />

      <WinConfetti
        active={winActive}
        onDone={() => setWinActive(false)}
      />
    </>
  );
}
