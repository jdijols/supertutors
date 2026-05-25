import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { audioEngine } from "../audioSingleton";
import { useFreddyIdle } from "@/lib/useFreddyIdle";
import { renderLine, type DialogueKey } from "../tutor/dialogue";
import { SpeechBubble } from "../scenes/world";
import { useTutorStore, type FreddyDisplay } from "../store/tutorStore";
import { LessonTable, type LessonTableHandle, type LessonTableSliceEvent } from "./LessonTable";
import { AhaAnimation } from "./AhaAnimation";
import { WinConfetti } from "./WinConfetti";
import type { TableState, TablePattern } from "./tableState";
import type { CvCameraHandle } from "@/platform/lesson-sdk";

/**
 * LessonScripted — Freddy's fraction-equivalence lesson (v2 arc).
 *
 * Goal: show that 2/4 = 1/2 with the half RIGHT THERE on the table for
 * comparison, instead of destroying it before the compare moment (v1 bug).
 *
 * Arc (6 main stages + nudges):
 *   intro          → kid slices whole pizza
 *   wait_halves    → table reaches 'twoHalves' pattern
 *   react_halves   → "Two halves. Now cut just ONE of those halves in two."
 *   wait_mixed     → table reaches 'oneHalfTwoQuarters' (target) or 'fourQuarters' (over-slice)
 *   react_mixed    → "Push those two quarters together right next to the half."
 *   react_mixed_alt→ recovery: kid sliced both halves; uses 4 quarters as the pair
 *   wait_compare   → table proximity finds an equal cluster
 *   aha_animating  → AhaAnimation playing
 *   reveal         → "Two-of-four equals one-of-two — equivalent fractions."
 *   win            → "Beautiful work."
 *   done           → completion card with Play again
 *
 * Architecture: stage transitions are STATE-DRIVEN (read tableState's
 * derived `pattern`), not EVENT-DRIVEN (no slice-count refs). This kills
 * the entire class of bugs where slicing ahead of Freddy's audio
 * silently locks the kid out — the world is the source of truth, and
 * the lesson catches up the moment it sees a recognized pattern.
 */

export interface LessonScriptedProps {
  name: string;
  /** Camera handle from the platform — threaded through to LessonTable. */
  cv?: CvCameraHandle;
}

type Stage =
  // Active prompts
  | "intro"
  | "wait_halves"
  | "react_halves"
  | "wait_mixed"
  | "react_mixed"
  | "react_mixed_alt"
  | "wait_compare"
  | "aha_animating"
  | "reveal"
  | "win"
  | "done"
  // Nudges (timer- or off-track-triggered)
  | "stuck_halves"
  | "stuck_mixed"
  | "stuck_compare"
  | "wrong_eighths";

const KEY_BY_STAGE: Partial<Record<Stage, DialogueKey>> = {
  intro: "lesson_intro_v2",
  stuck_halves: "lesson_stuck_halves_v2",
  react_halves: "lesson_react_halves_v2",
  stuck_mixed: "lesson_stuck_mixed_v2",
  react_mixed: "lesson_react_mixed_v2",
  react_mixed_alt: "lesson_react_mixed_alt_v2",
  wrong_eighths: "lesson_wrong_eighths_v2",
  stuck_compare: "lesson_stuck_compare_v2",
  reveal: "lesson_reveal_v2",
  win: "lesson_win_v2",
};

const NEXT_AFTER_DONE: Partial<Record<Stage, Stage>> = {
  intro: "wait_halves",
  stuck_halves: "wait_halves",
  react_halves: "wait_mixed",
  stuck_mixed: "wait_mixed",
  react_mixed: "wait_compare",
  react_mixed_alt: "wait_compare",
  wrong_eighths: "wait_mixed",
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
  react_halves: { facing: "student", gesture: "excited" },
  wait_mixed: { facing: "student", gesture: "neutral" },
  stuck_mixed: { facing: "student", gesture: "neutral" },
  react_mixed: { facing: "student", gesture: "excited" },
  react_mixed_alt: { facing: "student", gesture: "excited" },
  wrong_eighths: { facing: "student", gesture: "neutral" },
  wait_compare: { facing: "student", gesture: "neutral" },
  stuck_compare: { facing: "student", gesture: "neutral" },
  aha_animating: { facing: "student", gesture: "excited" },
  reveal: { facing: "student", gesture: "excited" },
  win: { facing: "student", gesture: "ok" },
  done: { facing: "student", gesture: "ok" },
};

const STUCK_DELAY_MS = 30_000;

/** Stages where the lesson is waiting for the kid to do something. */
function isWaitingStage(s: Stage): boolean {
  return s === "wait_halves" || s === "wait_mixed" || s === "wait_compare";
}

/**
 * Audio preconditions — before playing a line, check the world matches
 * what the line assumes. If the world drifted (kid did something unexpected
 * during audio), the precondition fails and we route to a fallback stage
 * instead of speaking a contradictory line.
 *
 * The intro line is unconditional. The react_* lines are precondition-gated
 * because that's where contradictions hurt most.
 */
const PRECONDITIONS: Partial<Record<Stage, (p: TablePattern) => boolean>> = {
  react_halves: (p) =>
    p === "twoHalves" || p === "oneHalfTwoQuarters" || p === "fourQuarters",
  react_mixed: (p) => p === "oneHalfTwoQuarters",
  react_mixed_alt: (p) => p === "fourQuarters",
};

/** Which tool the kid needs for each stage. Scripted lesson sets this
 * explicitly so Freddy hands the kid the right tool at the right moment
 * — they never have to figure out tool-switching mid-flow. */
const TOOL_BY_STAGE: Partial<Record<Stage, "cutter" | "glove">> = {
  intro: "cutter",
  wait_halves: "cutter",
  react_halves: "cutter",
  wait_mixed: "cutter",
  stuck_halves: "cutter",
  stuck_mixed: "cutter",
  wrong_eighths: "cutter",
  // Compare + reveal + win: pieces only get moved, not sliced.
  react_mixed: "glove",
  react_mixed_alt: "glove",
  wait_compare: "glove",
  stuck_compare: "glove",
  aha_animating: "glove",
  reveal: "glove",
  win: "glove",
  done: "glove",
};

export function LessonScripted({ name, cv }: LessonScriptedProps) {
  const setFreddy = useTutorStore((s) => s.setFreddy);
  const setSpotlight = useTutorStore((s) => s.setSpotlight);
  const setToolMode = useTutorStore((s) => s.setToolMode);

  const [stage, setStage] = useState<Stage>("intro");
  const [activeBubble, setActiveBubble] = useState<DialogueKey | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ahaActive, setAhaActive] = useState(false);
  const [winActive, setWinActive] = useState(false);
  // Derived snapshot of the table — fed by LessonTable's onTableStateChange.
  // Single source of truth for stage transitions. See ./tableState.ts.
  const [tableState, setTableState] = useState<TableState | null>(null);

  // Ref to LessonTable so we can reset its internal AHA lock on stage entry.
  const tableRef = useRef<LessonTableHandle>(null);
  // Guard: AHA fires only once per lesson run.
  const ahaFiredRef = useRef(false);
  // Guard: wrong_eighths nudge fires once per lesson (kid can't easily
  // recover from over-slicing; bouncing them through the nudge repeatedly
  // would loop forever as the table stays in 'hasEighths').
  const wrongEighthsFiredRef = useRef(false);

  useFreddyIdle({ enabled: isWaitingStage(stage) });

  // On mount: clear spotlight, warm up all v2 audio.
  useEffect(() => {
    setSpotlight(null);
    audioEngine.preloadDialogue("lesson_intro_v2");
    audioEngine.preloadDialogue("lesson_react_halves_v2");
    audioEngine.preloadDialogue("lesson_react_mixed_v2");
    audioEngine.preloadDialogue("lesson_react_mixed_alt_v2");
    audioEngine.preloadDialogue("lesson_reveal_v2");
    audioEngine.preloadDialogue("lesson_win_v2");
  }, [setSpotlight]);

  // Freddy pose per stage.
  useEffect(() => {
    const pose = FREDDY_BY_STAGE[stage];
    if (pose) setFreddy(pose);
  }, [stage, setFreddy]);

  // Tool per stage — Freddy hands the kid the right tool at the right
  // moment so they never have to pick between glove + cutter mid-flow.
  useEffect(() => {
    const tool = TOOL_BY_STAGE[stage];
    if (tool) setToolMode(tool);
  }, [stage, setToolMode]);

  // Mirror speaking state into store so FreddyCharacter mouth animates.
  useEffect(() => {
    setFreddy({ speaking: isSpeaking });
  }, [isSpeaking, setFreddy]);

  // Drive bubble from stage with audio precondition gating.
  // If the world drifted away from what this stage's line assumes, we
  // route to a recovery stage instead of speaking the contradictory line.
  useEffect(() => {
    const key = KEY_BY_STAGE[stage];
    if (!key) {
      setActiveBubble(null);
      return;
    }
    const precondition = PRECONDITIONS[stage];
    if (precondition && tableState && !precondition(tableState.pattern)) {
      // World doesn't match what this line assumes — try to recover by
      // re-deriving from current pattern.
      const recovered = recoverStageFromPattern(tableState.pattern);
      if (recovered && recovered !== stage) {
        setStage(recovered);
        return;
      }
      // No clean recovery — skip the bubble; the state-driven effect
      // below will catch up when the world settles.
      setActiveBubble(null);
      return;
    }
    setActiveBubble(key);
    // tableState in deps so a precondition that initially failed gets
    // re-checked after the world settles into a matching pattern.
  }, [stage, tableState]);

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

  // ─── State-driven transitions (the heart of v2) ──────────────────────
  // Read tableState's pattern; transition based on world state, not events.
  // This single effect replaces the v1 event-driven handleSlice branches
  // AND the v1 pre-emptive-slice recovery effect — both subsumed by
  // reading the world directly.
  useEffect(() => {
    if (!tableState) return;

    // Off-track first: over-sliced into eighths. One-shot to avoid
    // looping (the table stays in 'hasEighths' until reset).
    if (
      tableState.pattern === "hasEighths" &&
      !wrongEighthsFiredRef.current &&
      isWaitingStage(stage)
    ) {
      wrongEighthsFiredRef.current = true;
      setStage("wrong_eighths");
      return;
    }

    // wait_halves: any pattern at or beyond 2 halves means the kid has
    // sliced (or sliced way ahead). Advance to react_halves; the next
    // stage's transition will catch up to whatever the world looks like.
    if (stage === "wait_halves") {
      if (
        tableState.pattern === "twoHalves" ||
        tableState.pattern === "oneHalfTwoQuarters" ||
        tableState.pattern === "fourQuarters"
      ) {
        setStage("react_halves");
      }
      return;
    }

    // wait_mixed: target is oneHalfTwoQuarters (clean half + 2 quarters).
    // Recovery is fourQuarters (kid sliced both halves). Each routes to
    // its matching dialogue branch.
    if (stage === "wait_mixed") {
      if (tableState.pattern === "oneHalfTwoQuarters") {
        setStage("react_mixed");
      } else if (tableState.pattern === "fourQuarters") {
        setStage("react_mixed_alt");
      }
      return;
    }
  }, [tableState, stage]);

  // Stuck timers — fire only when no recognized advancement happens.
  useEffect(() => {
    if (stage !== "wait_halves") return;
    const t = setTimeout(() => {
      setStage((s) => (s === "wait_halves" ? "stuck_halves" : s));
    }, STUCK_DELAY_MS);
    return () => clearTimeout(t);
  }, [stage]);

  useEffect(() => {
    if (stage !== "wait_mixed") return;
    const t = setTimeout(() => {
      setStage((s) => (s === "wait_mixed" ? "stuck_mixed" : s));
    }, STUCK_DELAY_MS);
    return () => clearTimeout(t);
  }, [stage]);

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

  // handleSlice is a no-op for stage transitions — those are state-driven.
  // Kept as a sink for the LessonTable onSlice event in case we want to
  // add inline reactions (sound effects, particles) later.
  const handleSlice = useCallback((_event: LessonTableSliceEvent) => {
    void _event;
  }, []);

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
  useEffect(() => {
    if (stage === "win") {
      setWinActive(true);
    }
  }, [stage]);

  // Clear stage-specific spotlight when entering compare beat.
  useEffect(() => {
    if (stage === "wait_compare") {
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
        onTableStateChange={setTableState}
        scriptedMode={true}
        cv={cv}
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

      {/* Lesson-complete card — fades in once the closing line finishes
          and stage settles into `done`. Gives the kid a clear "you made it"
          beat plus a Play again affordance so they're not stranded. */}
      {stage === "done" && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 grid place-items-center z-40 pointer-events-none">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 24 }}
            className="pointer-events-auto bg-sb-paper border-2 border-sb-ink rounded-3xl px-8 py-6 shadow-2xl shadow-sb-accent-deep/30 text-center max-w-sm"
          >
            <div className="text-2xl sm:text-3xl font-bold text-sb-ink mb-1">
              Lesson complete!
            </div>
            <div className="text-base text-sb-ink/70 mb-5">
              2/4 = 1/2 🍕
            </div>
            <motion.button
              type="button"
              data-testid="lesson-play-again"
              onClick={() => {
                const target = `/lessons/freddy-fractions?lesson=scripted${name ? `&name=${encodeURIComponent(name)}` : ""}`;
                window.location.href = target;
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 600, damping: 22 }}
              className="px-6 py-3 rounded-full bg-sb-ink text-sb-paper text-lg font-semibold shadow-xl shadow-sb-accent-deep/25 border-2 border-sb-paper hover:bg-sb-ink/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface cursor-pointer"
            >
              Play again →
            </motion.button>
          </motion.div>
        </div>
      )}
    </>
  );
}

/**
 * Recovery routing for failed audio preconditions. If we tried to play a
 * line that doesn't match the world, pick a stage whose precondition
 * matches the current pattern.
 */
function recoverStageFromPattern(pattern: TablePattern): Stage | null {
  if (pattern === "twoHalves") return "react_halves";
  if (pattern === "oneHalfTwoQuarters") return "react_mixed";
  if (pattern === "fourQuarters") return "react_mixed_alt";
  return null;
}
