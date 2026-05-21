import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "@/modules/audio/AudioEngine";
import {
  lineHasNameSlot,
  renderLine,
  type DialogueKey,
} from "@/modules/tutor/dialogue";
import { SpeechBubble } from "@/modules/world";
import { useAppStore } from "@/store/appStore";
import {
  LessonTable,
  type LessonTableAddEvent,
  type LessonTableHandle,
  type LessonTableSliceEvent,
} from "./LessonTable";

/**
 * LessonExploration — Act 1 (Explore) of the 3-act demo arc.
 *
 * Mounts the manipulative workspace (`<LessonTable />`) and Freddy as the
 * sole narrator. Every text reaction — milestone, AHA, Win — comes out of
 * Freddy's mouth (no toasts, no second narrator voice). The kid plays
 * freely; Freddy reacts in real time.
 *
 * ### Bubble priority + drop-if-busy
 *
 * Two priority tiers:
 *   - **High** — `lesson_play_intro`, `aha_reveal`, `lesson_win`. These
 *     are story beats; they override any low-priority bubble currently
 *     speaking.
 *   - **Low** — `react_halves`, `react_quarters`, `react_eighths`,
 *     `react_new_pizza`, `react_delivered`. These are ambient reactions.
 *     If Freddy is already mid-line (any priority), a new low-priority
 *     bubble is **dropped, not queued** — avoids pileup when the kid
 *     slices fast. High-priority always interrupts (rare, important).
 *
 * ### Audio preload
 *
 * When `toolMode === 'cutter'`, the next 3 likely milestone audio files
 * are pre-warmed via `audioEngine.preloadDialogue`. By the time the kid
 * lands a cut, Freddy's reaction is already in the HTTP cache.
 *
 * The XState `tutorMachine` is preserved but only mounts under
 * `?beat=aha` / `?beat=win` (see `LessonView`). Act 2 (Instruct — Share
 * the Pizza port) and Act 3 (Check) will reuse the machine when authored.
 */

export interface LessonExplorationProps {
  name: string;
}

type Priority = "low" | "high";

interface ActiveBubble {
  key: DialogueKey;
  priority: Priority;
}

const PRIORITY_BY_KEY: Partial<Record<DialogueKey, Priority>> = {
  lesson_play_intro: "high",
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

function milestoneKeyFor(
  childrenFraction: LessonTableSliceEvent["childrenFraction"],
): DialogueKey | null {
  if (childrenFraction === "1/2") return "react_halves";
  if (childrenFraction === "1/4") return "react_quarters";
  if (childrenFraction === "1/8") return "react_eighths";
  return null;
}

export function LessonExploration({ name }: LessonExplorationProps) {
  const tableRef = useRef<LessonTableHandle>(null);
  const toolMode = useAppStore((s) => s.toolMode);

  const [activeBubble, setActiveBubble] = useState<ActiveBubble | null>({
    key: "lesson_play_intro",
    priority: "high",
  });
  // True while AudioEngine is actively playing a line. Used to gate
  // low-priority reactions from interrupting.
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Per-session lockouts so AHA and Win bubbles only fire once.
  const ahaShownRef = useRef(false);
  const winShownRef = useRef(false);

  /**
   * Set the active bubble subject to the priority rules:
   *   - No bubble open → always set.
   *   - High beats low → high always interrupts.
   *   - Same or lower priority AND currently speaking → drop.
   *   - Otherwise → set.
   */
  const showBubble = useCallback(
    (key: DialogueKey) => {
      const incoming = priorityOf(key);
      setActiveBubble((current) => {
        if (!current) return { key, priority: incoming };
        if (incoming === "high" && current.priority === "low") {
          return { key, priority: incoming };
        }
        if (isSpeaking) return current; // drop, don't queue
        return { key, priority: incoming };
      });
    },
    [isSpeaking],
  );

  // Auto-play audio whenever the active bubble changes. Tracks speaking
  // state via the onDone callback so showBubble can gate accordingly.
  useEffect(() => {
    if (!activeBubble) {
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const key = activeBubble.key;
    audioEngine.play({
      dialogueKey: key,
      hasNameSlot: lineHasNameSlot(key),
      name,
      onDone: () => setIsSpeaking(false),
    });
    return () => {
      audioEngine.stop();
      setIsSpeaking(false);
    };
  }, [activeBubble, name]);

  // Preload next-cut audio when the cutter is active so reactions land
  // with zero perceptible delay.
  useEffect(() => {
    if (toolMode !== "cutter") return;
    audioEngine.preloadDialogue("react_halves");
    audioEngine.preloadDialogue("react_quarters");
    audioEngine.preloadDialogue("react_eighths");
  }, [toolMode]);

  // Pre-warm Win + AHA so the hero moments don't stutter when proximity
  // hits the threshold.
  useEffect(() => {
    audioEngine.preloadDialogue("aha_reveal");
    audioEngine.preloadDialogue("lesson_win");
  }, []);

  function handleSlice(event: LessonTableSliceEvent) {
    // Dismiss the intro the moment the kid actually starts playing.
    if (activeBubble?.key === "lesson_play_intro") {
      setActiveBubble(null);
    }
    const key = milestoneKeyFor(event.childrenFraction);
    if (key) showBubble(key);
  }

  function handlePizzaAdded(event: LessonTableAddEvent) {
    // First (initial) pizza doesn't need a reaction — only subsequent
    // additions get the "fresh outta the oven" line.
    if (event.totalCount > 1) {
      showBubble("react_new_pizza");
    }
  }

  function handleDelivered() {
    showBubble("react_delivered");
  }

  function handleAha() {
    if (ahaShownRef.current) return;
    ahaShownRef.current = true;
    showBubble("aha_reveal");
  }

  function handleWin() {
    if (winShownRef.current) return;
    winShownRef.current = true;
    showBubble("lesson_win");
  }

  return (
    <>
      <LessonTable
        ref={tableRef}
        onSlice={handleSlice}
        onPizzaAdded={handlePizzaAdded}
        onDelivered={handleDelivered}
        onAha={handleAha}
        onWin={handleWin}
      />

      {/* Freddy speaks here. One bubble at a time — priority + drop-if-busy
          gate replacements (see showBubble). Position matches LessonView's
          onboarding bubbles so the kid's eye doesn't jump. */}
      <div className="absolute left-[20%] md:left-[26%] bottom-[35vh] md:bottom-[42vh] max-w-md z-30">
        <SpeechBubble
          open={activeBubble !== null}
          speaker="Freddy"
          tailSide="top-left"
          onTap={() => setActiveBubble(null)}
        >
          {activeBubble ? renderLine(activeBubble.key, { name }) : null}
        </SpeechBubble>
      </div>
    </>
  );
}
