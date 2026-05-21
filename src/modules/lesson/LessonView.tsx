import { useEffect, useRef, useState } from "react";
import { useMachine } from "@xstate/react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { audioEngine } from "@/modules/audio/AudioEngine";
import { renderLine, type DialogueKey } from "@/modules/tutor/dialogue";
import { dialogueKeyForState } from "@/modules/tutor/dialogueForState";
import { tutorMachine, type TutorEvent } from "@/modules/tutor/tutorMachine";
import { AhaAnimation } from "./AhaAnimation";
import { WinConfetti } from "./WinConfetti";
import { LessonExploration } from "./LessonExploration";
import { useDemoMode } from "@/lib/demoMode";
import { useHoldToReset } from "@/lib/useHoldToReset";
import { getInspectorOption } from "@/lib/inspector";
import {
  FreddyCharacter,
  NameInputOverlay,
  NumberBar,
  RestaurantScene,
  SpeechBubble,
  ToolPicker,
} from "@/modules/world";

/**
 * LessonView — the full-bleed world.
 *
 * Two phases:
 *   1) Onboarding (no machine): greeting bubble → name capture → response.
 *      Driven by local React state because the machine has no onboarding
 *      states yet (Beat 1 / Beat 1.5 author later in Stately).
 *   2) Lesson: once name is set + the response audio ends, the right
 *      sub-component mounts:
 *        - **Default path** (no beat= flag): `LessonExploration` renders
 *          the manipulative workspace via `<LessonTable />` with Freddy
 *          reaction bubbles on slice / AHA / Win. This is Act 1 (Explore)
 *          of the 3-act demo arc — proximity-driven, no state machine.
 *        - **Demo / QA path** (?beat=aha or ?beat=win): `LessonMachineRoot`
 *          mounts the XState `tutorMachine` so beat-skip keyboard shortcuts
 *          and the existing e2e tests (beat-6-aha, beat-8-win) keep working.
 *          The bubble text comes from `dialogueKeyForState(state.value)`.
 *
 * Demo mode (CC.1) exposes hidden dev controls in the corner for sending
 * SLICED / PROXIMITY / ANIMATION_DONE directly to the machine — the
 * temporary input surface from P1.4 the real Table will replace.
 */
export function LessonView() {
  const name = useAppStore((s) => s.name);
  const setName = useAppStore((s) => s.setName);
  const resetStore = useAppStore((s) => s.reset);
  const [searchParams] = useSearchParams();

  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [responseShown, setResponseShown] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  const inOnboarding = !name;
  const showGreetingBubble = inOnboarding && !greetingDismissed;
  const showResponseBubble = !inOnboarding && responseShown && !onboardingDone;

  // Demo / QA path: `?beat=aha` and `?beat=win` route through the XState
  // machine (preserves beat-6 + beat-8 e2e coverage and demo-mode beat
  // skipping). Default path uses proximity-driven LessonExploration —
  // no machine, kid plays naturally and Freddy reacts to milestones.
  const beatParam = searchParams.get("beat");
  const useMachine = beatParam === "aha" || beatParam === "win";

  function handleNameSubmit(submitted: string) {
    setName(submitted);
    setGreetingDismissed(true);
    setResponseShown(true);
  }

  // CC.2 — Tap-and-hold Freddy to restart the whole session. The hold target
  // is an invisible div over Freddy's head area (Freddy himself is
  // pointer-events-none to avoid eating drag events from manipulative pieces
  // that pass over him).
  const freddyHoldRef = useRef<HTMLDivElement>(null);
  const { isHolding: isResetting, progress: resetProgress } = useHoldToReset({
    ref: freddyHoldRef,
    onReset: () => {
      audioEngine.stop();
      resetStore();
      setGreetingDismissed(false);
      setResponseShown(false);
      setOnboardingDone(false);
    },
  });

  // Greeting audio: plays while the bubble is visible. User taps to dismiss.
  useEffect(() => {
    if (showGreetingBubble) {
      audioEngine.play({
        dialogueKey: "onboarding_greeting",
        onDone: () => {},
      });
    }
    return () => audioEngine.stop();
  }, [showGreetingBubble]);

  // Response audio: plays after name submit; on completion, hand off to
  // the state machine.
  useEffect(() => {
    if (showResponseBubble && name) {
      audioEngine.play({
        dialogueKey: "onboarding_response",
        hasNameSlot: true,
        name,
        onDone: () => {
          setResponseShown(false);
          setOnboardingDone(true);
        },
      });
    }
    return () => audioEngine.stop();
  }, [showResponseBubble, name]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-sb-surface">
      <RestaurantScene>
        <div className="absolute left-2 md:left-8 bottom-0 z-10">
          <FreddyCharacter
            pose="facing_student"
            gesture="ok"
            mouth={showGreetingBubble || showResponseBubble ? "open" : "closed"}
            className="h-[88vh] md:h-[100vh] w-auto"
          />
          {/* Hold-to-reset hit area over Freddy's head/torso. Invisible so
              kids who don't know about the gesture aren't distracted, but
              tappable. Progress hint surfaces a moment into the hold. */}
          <div
            ref={freddyHoldRef}
            data-testid="freddy-hold-target"
            role="button"
            aria-label="Hold to restart the lesson"
            className="absolute top-[8vh] left-[10%] w-[55%] h-[40vh] rounded-3xl cursor-pointer"
          />
        </div>
      </RestaurantScene>

      {/* Hold-to-reset feedback — appears as the hold progresses. */}
      {isResetting && resetProgress > 0.25 ? (
        <div
          data-testid="reset-progress-indicator"
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-sb-ink/90 text-sb-paper-soft text-xs font-mono uppercase tracking-widest shadow-lg pointer-events-none"
        >
          Restart in {Math.max(1, Math.ceil((1 - resetProgress) * 1.5))}s
        </div>
      ) : null}

      <div className="absolute left-[20%] md:left-[26%] bottom-[35vh] md:bottom-[42vh] max-w-md z-30">
        <SpeechBubble
          open={showGreetingBubble}
          speaker="Freddy"
          tailSide="top-left"
          onTap={() => setGreetingDismissed(true)}
        >
          {renderLine("onboarding_greeting")}
        </SpeechBubble>
        <SpeechBubble
          open={showResponseBubble}
          speaker="Freddy"
          tailSide="top-left"
        >
          {name ? renderLine("onboarding_response", { name }) : null}
        </SpeechBubble>
      </div>

      {/* Name input overlay — onboarding only, centered. */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <NameInputOverlay
            open={inOnboarding && greetingDismissed}
            onSubmit={handleNameSubmit}
          />
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-40">
        <NumberBar
          open={false}
          onDigit={() => undefined}
          onDelete={() => undefined}
        />
      </div>

      <div className="absolute bottom-6 right-6 z-40">
        <ToolPicker visible={false} />
      </div>

      {/* Lesson body mounts once onboarding is complete.
          Beat URL flag routes through the XState machine; default path
          uses proximity-driven exploration. */}
      {onboardingDone && name ? (
        useMachine ? (
          <LessonMachineRoot name={name} />
        ) : (
          <LessonExploration name={name} />
        )
      ) : null}
    </main>
  );
}

/**
 * Mounts the tutorMachine after onboarding, drives the in-lesson bubble +
 * (in demo mode) the dev event controls. Lives in LessonView's portal-style
 * tree so positioning sits on top of the restaurant scene.
 */
function LessonMachineRoot({ name }: { name: string }) {
  const [searchParams] = useSearchParams();
  const { enabled: demoMode } = useDemoMode();
  const [state, send] = useMachine(tutorMachine, {
    input: { name },
    inspect: getInspectorOption(),
  });

  // Respect the demo-mode `?beat=` jump so key "6" lands cleanly on Beat 6,
  // key "8" jumps to the Win confetti.
  useEffect(() => {
    const beat = searchParams.get("beat");
    if (beat === "aha") send({ type: "RESET" });
    if (beat === "win") send({ type: "WIN_DEMO" });
  }, [searchParams, send]);

  const activeDialogueKey = dialogueKeyForState(state.value);
  const ahaTriggered = state.matches({ aha: "aha_triggered" });
  const winActive = state.matches("win");

  // CC.3 — preload Beat 6's most likely next line while the setup line plays.
  // aha_setup plays while the kid is reading; by the time they slice,
  // aha_compare_prompt is already in the HTTP cache.
  useEffect(() => {
    if (state.matches({ aha: "setup" })) {
      audioEngine.preloadDialogue("aha_compare_prompt");
      audioEngine.preloadDialogue("aha_wrong_slice");
    }
  }, [state]);

  return (
    <>
      <div className="absolute left-[20%] md:left-[26%] bottom-[35vh] md:bottom-[42vh] max-w-md z-30">
        <SpeechBubble
          open={activeDialogueKey !== null}
          speaker="Freddy"
          tailSide="top-left"
        >
          {activeDialogueKey
            ? renderLine(activeDialogueKey as DialogueKey, { name })
            : null}
        </SpeechBubble>
      </div>

      {/* P5.11 — AHA hero animation. Fires on `aha_triggered`, auto-sends
          ANIMATION_DONE when complete, which advances the machine into
          `celebrating` to play the reveal line. */}
      <AhaAnimation
        active={ahaTriggered}
        onDone={() => send({ type: "ANIMATION_DONE" })}
      />

      {/* P5.9 — Win confetti. Fires when machine enters `win` state
          (Beat 8, authored later in Stately). Accessible via ?beat=win. */}
      <WinConfetti
        active={winActive}
        onDone={() => send({ type: "RESET" })}
      />

      {demoMode ? (
        <LessonDevControls
          stateValue={JSON.stringify(state.value)}
          onSend={send}
        />
      ) : null}
    </>
  );
}

/**
 * Hidden dev controls — only mounted in demo mode (?demo=true). Sends
 * synthetic SLICED / PROXIMITY / ANIMATION_DONE events so we can walk
 * the machine through every Beat 6 branch without the Table wired up.
 * Removed once the real Table emits these events directly.
 */
function LessonDevControls({
  stateValue,
  onSend,
}: {
  stateValue: string;
  onSend: (event: TutorEvent) => void;
}) {
  return (
    <div
      data-testid="lesson-dev-controls"
      className="absolute top-4 left-4 z-50 flex flex-col gap-1 bg-sb-ink/85 text-sb-paper-soft p-3 rounded-lg font-mono text-[11px] shadow-xl"
    >
      <div className="opacity-70 mb-1">State: {stateValue}</div>
      <button
        type="button"
        className="px-2 py-1 rounded bg-sb-paper/10 hover:bg-sb-paper/20 text-left"
        onClick={() =>
          onSend({ type: "SLICED", pieceId: "dev", parentFraction: "1/2" })
        }
      >
        SLICED (1/2) → correct
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-sb-paper/10 hover:bg-sb-paper/20 text-left"
        onClick={() =>
          onSend({ type: "SLICED", pieceId: "dev", parentFraction: "1/4" })
        }
      >
        SLICED (1/4) → wrong
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-sb-paper/10 hover:bg-sb-paper/20 text-left"
        onClick={() => onSend({ type: "PROXIMITY", comparison: "equal" })}
      >
        PROXIMITY (equal) → AHA
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-sb-paper/10 hover:bg-sb-paper/20 text-left"
        onClick={() => onSend({ type: "PROXIMITY", comparison: "not_equal" })}
      >
        PROXIMITY (not_equal)
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-sb-paper/10 hover:bg-sb-paper/20 text-left"
        onClick={() => onSend({ type: "ANIMATION_DONE" })}
      >
        ANIMATION_DONE
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-sb-paper/10 hover:bg-sb-paper/20 text-left"
        onClick={() => onSend({ type: "RESET" })}
      >
        RESET to setup
      </button>
    </div>
  );
}
