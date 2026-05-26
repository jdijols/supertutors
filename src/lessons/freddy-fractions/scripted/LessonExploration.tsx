import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { audioEngine } from "../audioSingleton";
import { useFreddyIdle } from "@/lib/useFreddyIdle";
import {
  renderLine,
  type DialogueKey,
} from "../tutor/dialogue";
import { SpeechBubble } from "../scenes/world";
import {
  useTutorStore,
  type FreddyDisplay,
  type Spotlight,
} from "../store/tutorStore";
import {
  LessonTable,
  type LessonTableAddEvent,
  type LessonTableHandle,
  type LessonTableSliceEvent,
} from "./LessonTable";
import type { CvCameraHandle } from "@/platform/lesson-sdk";

/**
 * LessonExploration — Act 1 (Explore) of the 3-act demo arc.
 *
 * Mounts the manipulative workspace (`<LessonTable />`) and Freddy as the
 * sole narrator. Every text reaction — milestone, AHA, Win — comes out of
 * Freddy's mouth (no toasts, no second narrator voice).
 *
 * ### Exploration script — bookended act
 *
 * Walks through a 7-stage progression so the act has a real arc instead
 * of "intro line then chaos":
 *
 *   1. `intro_1` — "Alright, this is my counter, kid."        (no spotlight)
 *   2. `intro_2` — "Slicer and glove are right down there."   (ToolPicker pulse)
 *   3. `intro_3` — "Pizzas come outta the oven."              (AddPizza pulse + menu pops)
 *   4. `intro_4` — "Deliveries go in the box. Have a play."   (DeliveryBox pulse)
 *   5. `free_play` — kid messes around; react_* lines play ambiently
 *   6. `cued` — Freddy: "Tap me when you're done messin' around"
 *      (fires 8s after "have a play around" finishes — pure timed trigger,
 *      regardless of whether the kid has delivered a pizza yet).
 *      Start Lesson button + tap-Freddy hit area materialize.
 *   7. `handing_off` — kid taps either affordance → "Alright, let's start
 *      here." Once that line ends, `onComplete()` fires so the next act
 *      (Share-the-Pizza) can take over. Until that act is authored, we
 *      stay in `done` and Freddy stays quiet — the table remains playable.
 *
 * Each opener sub-line sets `appStore.spotlight` as it begins so the
 * named UI element pulses + scales (see `globals.css .spotlight-pulse`).
 * The AddPizzaButton additionally auto-opens its variant menu while
 * spotlit (teaching beat, not an action gate).
 *
 * ### Bubble priority + drop-if-busy
 *
 * Two priority tiers:
 *   - **High** — all `explore_*`, `aha_reveal`, `lesson_win`. Story beats;
 *     never dropped, never interrupted by reactions.
 *   - **Low** — `react_halves`, `react_quarters`, `react_eighths`,
 *     `react_new_pizza`, `react_delivered`. Ambient texture. Gated on
 *     `isSpeaking` so a high-priority line in progress drops them; same
 *     priority while speaking also drops (avoid pileup on fast slicing).
 *
 * Reactions ONLY fire during `free_play` — during the intro tour, during
 * the cue, and after handoff, the bubble belongs to scripted content.
 */

export interface LessonExplorationProps {
  name: string;
  /**
   * When false, the workspace renders but Freddy stays quiet — no
   * auto-fired intro chain, no milestone bubbles. Used so the table
   * (pizzas, tools, add button, delivery box) is visible during the
   * onboarding bubble + name input, without Freddy stepping on his
   * own greeting.
   */
  active?: boolean;
  /**
   * Fired when the handoff line finishes — i.e., the exploration act is
   * complete and the next act (Share-the-Pizza) should take over.
   * Optional because that act isn't authored yet; parent can no-op for
   * now and the table will remain playable.
   */
  onComplete?: () => void;
  /** Camera handle from the platform — threaded through to LessonTable. */
  cv?: CvCameraHandle;
}

type Stage =
  | "pre"
  | "intro_1"
  | "intro_2"
  | "intro_3"
  | "intro_4"
  | "free_play"
  | "cued"
  | "handing_off"
  | "done";

type Priority = "low" | "high";

interface ActiveBubble {
  key: DialogueKey;
  priority: Priority;
}

const PRIORITY_BY_KEY: Partial<Record<DialogueKey, Priority>> = {
  explore_intro_1: "high",
  explore_intro_2: "high",
  explore_intro_3: "high",
  explore_intro_4: "high",
  explore_cue: "high",
  explore_handoff: "high",
  aha_reveal: "high",
  lesson_win: "high",
  react_halves: "low",
  react_quarters: "low",
  react_eighths: "low",
  react_new_pizza: "low",
  react_delivered: "low",
};

function priorityOf(key: DialogueKey): Priority {
  return PRIORITY_BY_KEY[key] ?? "low";
}

/** Spotlight target paired with each opener sub-line. */
const SPOTLIGHT_BY_STAGE: Partial<Record<Stage, Spotlight>> = {
  intro_2: "toolpicker",
  intro_3: "add",
  intro_4: "delivery",
};

/**
 * Freddy pose/gesture per stage (mouth handled separately via `speaking`).
 *
 * Design rule: the warm `ok` wave is reserved for the onboarding warm-up
 * (greeting + name recognition), which lives in LessonView. From the
 * counter tour onward Freddy uses the calmer `neutral` "explaining"
 * pose — the wave would over-perform every line and lose its meaning.
 *
 *   - intro_1..4 : facing student, `neutral` (explaining, not waving).
 *   - free_play  : same student-facing neutral pose, just mouth closed.
 *                  Freddy stays attentive while the kid plays — no
 *                  turning away. (We turn away only after the cue line.)
 *   - cued       : still `neutral` (no wave to undercut the "tap me on
 *                  the shoulder" request). When the cue line finishes,
 *                  the post-cue effect flips facing to `guest` so
 *                  Freddy returns to the customers while waiting for
 *                  the kid's tap.
 *   - handing_off: faces student `neutral` again to deliver the transition.
 *   - done       : default rest pose (student / neutral / not speaking).
 *
 * `pre` is intentionally omitted — LessonView owns Freddy state during
 * onboarding so the `ok` wave there isn't stomped by this child effect.
 */
const FREDDY_BY_STAGE: Partial<
  Record<Stage, Pick<FreddyDisplay, "facing" | "gesture">>
> = {
  intro_1: { facing: "student", gesture: "neutral" },
  intro_2: { facing: "student", gesture: "neutral" },
  intro_3: { facing: "student", gesture: "neutral" },
  intro_4: { facing: "student", gesture: "neutral" },
  free_play: { facing: "student", gesture: "neutral" },
  cued: { facing: "student", gesture: "neutral" },
  handing_off: { facing: "student", gesture: "neutral" },
  done: { facing: "student", gesture: "neutral" },
};

/** Dialogue key for each stage that plays a scripted line. */
const KEY_BY_STAGE: Partial<Record<Stage, DialogueKey>> = {
  intro_1: "explore_intro_1",
  intro_2: "explore_intro_2",
  intro_3: "explore_intro_3",
  intro_4: "explore_intro_4",
  cued: "explore_cue",
  handing_off: "explore_handoff",
};

/** Stage to advance to on dialogue completion (linear path). */
const NEXT_STAGE: Partial<Record<Stage, Stage>> = {
  intro_1: "intro_2",
  intro_2: "intro_3",
  intro_3: "intro_4",
  intro_4: "free_play",
  cued: "cued", // stays in `cued` waiting for kid's tap
  handing_off: "done",
};

/**
 * How long Freddy waits after telling the kid to "have a play around"
 * before delivering the cue line ("tap me when you're done messin'
 * around"). Pure timed beat — independent of whether the kid has
 * actually delivered a pizza yet. Keeps the act on rails so an
 * easily-distracted kid still hears the cue.
 */
const FREE_PLAY_CUE_DELAY_MS = 8_000;

function milestoneKeyFor(
  childrenFraction: LessonTableSliceEvent["childrenFraction"],
): DialogueKey | null {
  if (childrenFraction === "1/2") return "react_halves";
  if (childrenFraction === "1/4") return "react_quarters";
  if (childrenFraction === "1/8") return "react_eighths";
  return null;
}

export function LessonExploration({
  name,
  active = true,
  onComplete,
  cv,
}: LessonExplorationProps) {
  const tableRef = useRef<LessonTableHandle>(null);
  const toolMode = useTutorStore((s) => s.toolMode);
  const setSpotlight = useTutorStore((s) => s.setSpotlight);
  const setFreddy = useTutorStore((s) => s.setFreddy);

  const [stage, setStage] = useState<Stage>("pre");
  const [activeBubble, setActiveBubble] = useState<ActiveBubble | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Per-session lockouts so AHA / Win bubbles only fire once.
  const ahaShownRef = useRef(false);
  const winShownRef = useRef(false);

  /** Show a low-priority ambient reaction — gated by stage + isSpeaking. */
  const showReaction = useCallback(
    (key: DialogueKey) => {
      if (stage !== "free_play") return;
      if (isSpeaking) return; // drop, don't queue
      setActiveBubble({ key, priority: priorityOf(key) });
    },
    [stage, isSpeaking],
  );

  // Kick off the intro chain the moment the lesson becomes active.
  useEffect(() => {
    if (!active) return;
    setStage((s) => (s === "pre" ? "intro_1" : s));
  }, [active]);

  // Drive the bubble + spotlight + Freddy pose for each scripted stage.
  // When the stage changes to one that owns a line, we set the bubble +
  // spotlight; the audio effect (below) plays the line and advances on
  // done. Freddy's facing/gesture comes from FREDDY_BY_STAGE; mouth is
  // driven independently from `isSpeaking` so every line animates.
  useEffect(() => {
    const key = KEY_BY_STAGE[stage];
    const spotlight = SPOTLIGHT_BY_STAGE[stage] ?? null;
    setSpotlight(spotlight);

    const pose = FREDDY_BY_STAGE[stage];
    if (pose) setFreddy(pose);

    if (!key) {
      // Stages without a line: pre, free_play, done.
      // free_play keeps the workspace usable with no bubble; done means
      // the act is over and we wait for the next act to take over.
      if (stage !== "intro_1") setActiveBubble(null);
      return;
    }

    setActiveBubble({ key, priority: priorityOf(key) });

    // Clear spotlight on unmount so a downstream stage doesn't inherit
    // stale targeting if the component remounts mid-tour.
    return () => {
      if (SPOTLIGHT_BY_STAGE[stage]) setSpotlight(null);
    };
  }, [stage, setSpotlight, setFreddy]);

  // Mirror `isSpeaking` into the store so the FreddyCharacter in
  // LessonView swaps mouth open/closed for every line — not just the
  // first one. (Before this wire-up, the mouth only animated during
  // onboarding because LessonView read its own local state.)
  useEffect(() => {
    setFreddy({ speaking: isSpeaking });
  }, [isSpeaking, setFreddy]);

  // Character life: when Freddy hasn't visibly changed pose for 20s,
  // swap to a thinking-at-the-kid pose for 10s, then restore. Loops as
  // long as he stays idle. Only enabled in the "sandbox" stages where
  // Freddy isn't dialogue-locked — pre / intro_* / handing_off all
  // drive his pose directly, so we leave them alone.
  const idleEnabled =
    stage === "free_play" || stage === "cued" || stage === "done";
  useFreddyIdle({ enabled: idleEnabled });

  // Post-cue turn-away: once the cue line finishes (isSpeaking flips to
  // false while we're still in `cued`), Freddy pivots to face the
  // customers and waits for the kid's tap. This is the ONLY point in
  // the explore act where he turns away — the kid plays freely with
  // Freddy still attentive, until he asks them to tap, then he busies
  // himself with customers as the implicit "go ahead, take your time"
  // signal. Only `facing` changes; gesture stays at the prior `neutral`
  // (FreddyCharacter coerces to `pointing` for the guest view anyway).
  useEffect(() => {
    if (stage !== "cued") return;
    if (isSpeaking) return; // still delivering the line — keep student/neutral
    setFreddy({ facing: "guest" });
  }, [stage, isSpeaking, setFreddy]);

  // Audio playback — plays whenever activeBubble changes. Advances the
  // stage machine when a scripted line ends. `isSpeaking` is driven by
  // the engine's onSpeakingChange (which fires false at every sentence
  // boundary AND on overall completion), so the mouth-close beats at
  // every period drop through to freddy.speaking via the mirror effect.
  useEffect(() => {
    if (!activeBubble) {
      setIsSpeaking(false);
      return;
    }
    const key = activeBubble.key;
    const currentStage = stage;
    audioEngine.play({
      dialogueKey: key,
      name,
      onSpeakingChange: setIsSpeaking,
      onDone: () => {
        setIsSpeaking(false);
        // Advance the linear stage machine if this was a scripted line.
        const next = NEXT_STAGE[currentStage];
        if (next && next !== currentStage) {
          setStage(next);
        }
        // For ambient reactions in free_play, just clear the bubble.
        if (currentStage === "free_play") {
          setActiveBubble(null);
        }
      },
    });
    return () => {
      audioEngine.stop();
      setIsSpeaking(false);
    };
    // activeBubble identity drives playback; stage is captured at start time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBubble, name]);

  // Cue timer — fires FREE_PLAY_CUE_DELAY_MS after free_play begins
  // (i.e. after "have a play around" finishes). Pure timed trigger; the
  // kid doesn't need to have done anything to earn the cue.
  useEffect(() => {
    if (stage !== "free_play") return;
    const t = setTimeout(() => {
      setStage((s) => (s === "free_play" ? "cued" : s));
    }, FREE_PLAY_CUE_DELAY_MS);
    return () => clearTimeout(t);
  }, [stage]);

  // When the handoff line finishes (stage becomes 'done'), notify the
  // parent so the next act can take over. Until that act is authored
  // this is a no-op and the table stays playable.
  useEffect(() => {
    if (stage === "done") onComplete?.();
  }, [stage, onComplete]);

  // Pre-warm the next-cut + hero audio so reactions land with no perceptible
  // delay when the kid slices fast or hits the AHA/Win condition.
  useEffect(() => {
    if (toolMode !== "cutter") return;
    audioEngine.preloadDialogue("react_halves");
    audioEngine.preloadDialogue("react_quarters");
    audioEngine.preloadDialogue("react_eighths");
  }, [toolMode]);

  useEffect(() => {
    audioEngine.preloadDialogue("aha_reveal");
    audioEngine.preloadDialogue("lesson_win");
    // The intro chain — warm everything up front so each transition is
    // gapless.
    audioEngine.preloadDialogue("explore_intro_1");
    audioEngine.preloadDialogue("explore_intro_2");
    audioEngine.preloadDialogue("explore_intro_3");
    audioEngine.preloadDialogue("explore_intro_4");
    audioEngine.preloadDialogue("explore_cue");
    audioEngine.preloadDialogue("explore_handoff");
  }, []);

  function handleSlice(event: LessonTableSliceEvent) {
    const key = milestoneKeyFor(event.childrenFraction);
    if (key) showReaction(key);
  }

  function handlePizzaAdded(event: LessonTableAddEvent) {
    // First (initial) pizza doesn't need a reaction — only subsequent
    // additions get the "fresh outta the oven" line.
    if (event.totalCount > 1) {
      showReaction("react_new_pizza");
    }
  }

  function handleDelivered() {
    showReaction("react_delivered");
  }

  function handleAha() {
    if (ahaShownRef.current) return;
    if (stage !== "free_play") return;
    ahaShownRef.current = true;
    setActiveBubble({ key: "aha_reveal", priority: "high" });
  }

  function handleWin() {
    if (winShownRef.current) return;
    if (stage !== "free_play") return;
    winShownRef.current = true;
    setActiveBubble({ key: "lesson_win", priority: "high" });
  }

  function startLesson() {
    setStage((s) => (s === "cued" ? "handing_off" : s));
  }

  const showAffordances = stage === "cued";

  return (
    <>
      <LessonTable
        ref={tableRef}
        onSlice={handleSlice}
        onPizzaAdded={handlePizzaAdded}
        onDelivered={handleDelivered}
        onAha={handleAha}
        onWin={handleWin}
        cv={cv}
      />

      {/* Tap-Freddy hit area — transparent overlay covering Freddy's upper
          half ABOVE the counter only. Bottom edge mirrors the counter
          height expression in RestaurantScene (`max(31.51dvw, 47.27dvh)`)
          so taps that land on the counter — where the kid might still be
          playing with pizzas during the cue — pass through to the table
          instead of being swallowed as a tap on Freddy. If the counter
          sizing changes there, change it here too. */}
      {showAffordances && (
        <button
          type="button"
          data-testid="tap-freddy"
          aria-label="Tap Freddy to start the lesson"
          onClick={startLesson}
          className="absolute left-0 z-40 w-[42vw] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent rounded-2xl"
          style={{
            background: "transparent",
            bottom: "max(31.51dvw, 47.27dvh)",
            height: "calc(60dvh - max(31.51dvw, 47.27dvh))",
          }}
        />
      )}

      {/* Start Lesson button — bottom-center, only visible during the cue
          so the explore phase stays uncluttered. Materializes alongside
          Freddy's "tap me on the shoulder" line as the visible payoff. */}
      {showAffordances && (
        <div className="absolute inset-x-0 bottom-8 z-40 grid place-items-center pointer-events-none">
          <motion.button
            type="button"
            data-testid="start-lesson"
            onClick={startLesson}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 600, damping: 22 }}
            className="pointer-events-auto px-6 py-3 rounded-full bg-sb-ink text-sb-paper text-lg font-semibold shadow-xl shadow-sb-accent-deep/25 border-2 border-sb-paper hover:bg-sb-ink/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface cursor-pointer"
          >
            Start lesson →
          </motion.button>
        </div>
      )}

      {/* Freddy speaks here. One bubble at a time — priority + drop-if-busy
          gate replacements (see showReaction). Top-aligned with the UI
          button row, tail pointing down toward Freddy at lower-left. */}
      <div className="absolute top-4 sm:top-6 left-[35%] max-w-md z-30">
        <SpeechBubble
          open={activeBubble !== null}
          speaker="Freddy"
          tailSide="bottom-left"
          onTap={() => {
            // Only allow tap-to-dismiss for ambient reactions; scripted
            // lines drive their own onDone advance.
            if (activeBubble?.priority === "low") setActiveBubble(null);
          }}
        >
          {activeBubble ? renderLine(activeBubble.key, { name }) : null}
        </SpeechBubble>
      </div>
    </>
  );
}
