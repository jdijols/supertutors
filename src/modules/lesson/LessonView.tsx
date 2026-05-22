import { useEffect, useState } from "react";
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
import { getInspectorOption } from "@/lib/inspector";
import {
  FreddyCharacter,
  NameInputOverlay,
  RestaurantScene,
  SpeechBubble,
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
  const freddy = useAppStore((s) => s.freddy);
  const setFreddy = useAppStore((s) => s.setFreddy);
  const [searchParams] = useSearchParams();

  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [responseShown, setResponseShown] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  // True once Freddy's greeting finishes ("...what's your name, kid?") —
  // pulses the name input as a hand-off cue.
  const [nameInputPulsing, setNameInputPulsing] = useState(false);

  const inOnboarding = !name;
  const showGreetingBubble = inOnboarding && !greetingDismissed;
  const showResponseBubble = !inOnboarding && responseShown && !onboardingDone;

  // Demo / QA path: `?beat=aha` and `?beat=win` route through the XState
  // machine (preserves beat-6 + beat-8 e2e coverage and demo-mode beat
  // skipping). Default path uses proximity-driven LessonExploration —
  // no machine, kid plays naturally and Freddy reacts to milestones.
  const beatParam = searchParams.get("beat");
  const useMachine = beatParam === "aha" || beatParam === "win";

  // Skip-onboarding shortcut: `?skip=true` (with optional `?name=X`) jumps
  // straight into the exploration without the greeting/name-entry dance.
  // Used by e2e tests for fast iteration and by demo-mode key "2" so the
  // dev can hop right into the manipulative without retyping a name on
  // every reload. Production flow is unchanged.
  const skipOnboarding = searchParams.get("skip") === "true";
  const nameOverride = searchParams.get("name");
  useEffect(() => {
    if (skipOnboarding && !name) {
      setName(nameOverride ?? "Chef");
      setGreetingDismissed(true);
      setResponseShown(false);
      setOnboardingDone(true);
    }
    // Only fires once on mount with skip=true — subsequent renders won't
    // re-trigger because `name` is now set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipOnboarding, nameOverride]);

  function handleNameSubmit(submitted: string) {
    setName(submitted);
    setGreetingDismissed(true);
    setResponseShown(true);
    setNameInputPulsing(false);
  }

  // Re-focus the name input whenever the greeting bubble dismisses. The
  // input mounts at /lesson load (so the keyboard is visible from the
  // start), so its `autoFocus` fires before the kid taps the bubble —
  // which means the click defocuses the input. Re-focusing here keeps
  // the iPad keyboard live and matches the smoke-test contract.
  useEffect(() => {
    if (!greetingDismissed) return;
    // requestAnimationFrame so React's commit settles before we focus.
    const id = requestAnimationFrame(() => {
      const el = document.getElementById("kid-name");
      if (el instanceof HTMLInputElement) el.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [greetingDismissed]);

  // Greeting audio: plays while the bubble is visible. Auto-dismisses on
  // audio end so the kid isn't left with a stale bubble overlapping the
  // name input. User can also tap the bubble to dismiss early. The
  // engine drives freddy.speaking via onSpeakingChange — flipping at
  // every sentence boundary AND on overall completion, so the mouth
  // closes at every period.
  useEffect(() => {
    if (showGreetingBubble) {
      setFreddy({ facing: "student", gesture: "ok" });
      audioEngine.play({
        dialogueKey: "onboarding_greeting",
        onSpeakingChange: (speaking) => setFreddy({ speaking }),
        onDone: () => {
          setFreddy({ speaking: false });
          setGreetingDismissed(true);
          setNameInputPulsing(true);
        },
      });
    }
    return () => {
      audioEngine.stop();
      setFreddy({ speaking: false });
    };
  }, [showGreetingBubble, setFreddy]);

  // Response audio: plays after name submit; on completion, hand off to
  // the explore act. Mouth-close beats at sentence boundaries come from
  // onSpeakingChange.
  useEffect(() => {
    if (showResponseBubble && name) {
      setFreddy({ facing: "student", gesture: "ok" });
      audioEngine.play({
        dialogueKey: "onboarding_response",
        name,
        onSpeakingChange: (speaking) => setFreddy({ speaking }),
        onDone: () => {
          setFreddy({ speaking: false });
          setResponseShown(false);
          setOnboardingDone(true);
        },
      });
    }
    return () => {
      audioEngine.stop();
      setFreddy({ speaking: false });
    };
  }, [showResponseBubble, name, setFreddy]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-sb-surface select-none [-webkit-touch-callout:none]">
      <RestaurantScene>
        <div className="absolute left-[12px] bottom-0 z-10 pointer-events-none">
          <FreddyCharacter
            pose={freddy.facing === "student" ? "facing_student" : "facing_guest"}
            gesture={freddy.gesture}
            mouth={freddy.speaking ? "open" : "closed"}
            speaking={freddy.speaking}
            className="h-[100vh] w-auto"
          />
        </div>
      </RestaurantScene>

      {/* Bubble row — top-aligned with EXIT / mute chrome. Fixed left edge
          clear of the brick oven. Tail at bottom-left points down toward
          Freddy in the lower portion of the scene. Keeps the manipulative
          area (pizzas, tools, guests) unobstructed. */}
      <div className="absolute top-4 sm:top-6 left-[35%] max-w-md z-30">
        <SpeechBubble
          open={showGreetingBubble}
          speaker="Freddy"
          tailSide="bottom-left"
          onTap={() => setGreetingDismissed(true)}
        >
          {renderLine("onboarding_greeting")}
        </SpeechBubble>
        <SpeechBubble
          open={showResponseBubble}
          speaker="Freddy"
          tailSide="bottom-left"
        >
          {name ? renderLine("onboarding_response", { name }) : null}
        </SpeechBubble>
      </div>

      {/* Name input overlay — chat-style row pinned to the bottom counter
          edge so its bottom aligns with the tool picker (matching `bottom-6`).
          Visible the moment we're in onboarding so the kid can start typing
          immediately. */}
      <div className="absolute inset-x-0 bottom-6 grid place-items-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <NameInputOverlay
            open={inOnboarding}
            onSubmit={handleNameSubmit}
            pulse={nameInputPulsing}
          />
        </div>
      </div>

      {/* Workspace mounts from the start so the kid sees pizzas, tools,
          add button, and delivery box during onboarding. Freddy's lesson
          dialogue (the explore_intro chain, milestone reactions) stays
          silent until onboarding completes — gated via the `active` prop.
          The XState beat-flag path still waits for a real name. */}
      {useMachine ? (
        onboardingDone && name ? (
          <LessonMachineRoot name={name} />
        ) : null
      ) : (
        <LessonExploration
          name={name ?? ""}
          active={onboardingDone && !!name}
        />
      )}
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
      <div className="absolute top-4 sm:top-6 left-[35%] max-w-md z-30">
        <SpeechBubble
          open={activeDialogueKey !== null}
          speaker="Freddy"
          tailSide="bottom-left"
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
      // Sits below the AddPizzaButton (top-4 left-4 z-60) so the two
      // dev affordances don't overlap during demo-mode testing.
      className="absolute top-24 left-4 z-50 flex flex-col gap-1 bg-sb-ink/85 text-sb-paper-soft p-3 rounded-lg font-mono text-[11px] shadow-xl"
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
