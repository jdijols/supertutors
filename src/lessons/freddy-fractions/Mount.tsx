import { useEffect, useState } from "react";
import { useMachine } from "@xstate/react";
import { useSearchParams } from "react-router-dom";
import { useTutorStore } from "./store/tutorStore";
import { usePlatformStore } from "@/platform/stores/platformStore";
import { renderLine, type DialogueKey } from "./tutor/dialogue";
import { dialogueKeyForState } from "./tutor/dialogueForState";
import { tutorMachine, type TutorEvent } from "./tutor/tutorMachine";
import { AhaAnimation } from "./scripted/AhaAnimation";
import { WinConfetti } from "./scripted/WinConfetti";
import { LessonExploration } from "./scripted/LessonExploration";
import { LessonScripted } from "./scripted/LessonScripted";
import { LessonV3 } from "./scripted/_v3/LessonV3";
import { useDemoMode } from "@/lib/demoMode";
import { getInspectorOption } from "@/lib/inspector";
import {
  FreddyCharacter,
  NameInputOverlay,
  RestaurantScene,
  SpeechBubble,
  ToolCursorLayer,
} from "./scenes/world";
import type { LessonMountProps } from "@/platform/lesson-sdk";

export function FreddyMount({ name: propName, onComplete: _onComplete, platform }: LessonMountProps) {
  const { freddy, setFreddy } = useTutorStore();
  const [searchParams] = useSearchParams();

  const [searchParamsInitial] = useState(() => new URLSearchParams(window.location.search));
  const initialLessonParam = searchParamsInitial.get("lesson");
  const skipImmediately =
    searchParamsInitial.get("skip") === "true" ||
    initialLessonParam === "scripted" ||
    initialLessonParam === "v3";
  const skipToScriptedImmediately = initialLessonParam === "scripted";
  const skipToV3Immediately = initialLessonParam === "v3";

  const [greetingDismissed, setGreetingDismissed] = useState(skipImmediately || !!propName);
  const [responseShown, setResponseShown] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(skipImmediately || !!propName);
  const [explorationDone, setExplorationDone] = useState(skipToScriptedImmediately || skipToV3Immediately);
  const [scriptedDone, setScriptedDone] = useState(false);
  const [nameInputPulsing, setNameInputPulsing] = useState(false);

  // Progress session — started once when signed-in, shared by V2 and V3
  // so the whole lesson sitting rolls up to a single LessonSession.
  const [sessionId, setSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (!platform.progress) return;
    platform.progress
      .startSession("freddy-fractions")
      .then(setSessionId)
      .catch(console.error);
    return () => {
      // Best-effort end on unmount. Idempotent server-side.
      if (sessionId) {
        void platform.progress?.endSession(sessionId, "exit");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform.progress]);

  // name is the live value — propName updates when platformStore changes
  const name = propName || null;
  const inOnboarding = !name;
  const showGreetingBubble = inOnboarding && !greetingDismissed;
  const showResponseBubble = !inOnboarding && responseShown && !onboardingDone;

  const beatParam = searchParams.get("beat");
  const useMachineMode = beatParam === "aha" || beatParam === "win";

  const skipOnboarding = searchParams.get("skip") === "true";
  const nameOverride = searchParams.get("name");
  const skipToScripted = searchParams.get("lesson") === "scripted";
  const skipToV3 = searchParams.get("lesson") === "v3";

  useEffect(() => {
    if ((skipOnboarding || skipToScripted || skipToV3) && !name) {
      usePlatformStore.getState().setName(nameOverride ?? "Chef");
      setGreetingDismissed(true);
      setResponseShown(false);
      setOnboardingDone(true);
    }
    if ((skipToScripted || skipToV3) && !explorationDone) {
      setExplorationDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipOnboarding, skipToScripted, skipToV3, nameOverride]);

  function handleNameSubmit(submitted: string) {
    usePlatformStore.getState().setName(submitted);
    setGreetingDismissed(true);
    setResponseShown(true);
    setNameInputPulsing(false);
  }

  useEffect(() => {
    if (!greetingDismissed) return;
    const id = requestAnimationFrame(() => {
      const el = document.getElementById("kid-name");
      if (el instanceof HTMLInputElement) el.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [greetingDismissed]);

  useEffect(() => {
    if (showGreetingBubble) {
      setFreddy({ facing: "student", gesture: "ok" });
      platform.audio.play("onboarding_greeting", {
        onSpeakingChange: (speaking) => setFreddy({ speaking }),
      }).then(() => {
        setFreddy({ speaking: false });
        setGreetingDismissed(true);
        setNameInputPulsing(true);
      }).catch(() => {});
    }
    return () => {
      platform.audio.stop();
      setFreddy({ speaking: false });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGreetingBubble]);

  useEffect(() => {
    if (showResponseBubble && name) {
      setFreddy({ facing: "student", gesture: "ok" });
      platform.audio.play("onboarding_response", {
        name,
        onSpeakingChange: (speaking) => setFreddy({ speaking }),
      }).then(() => {
        setFreddy({ speaking: false });
        setResponseShown(false);
        setOnboardingDone(true);
      }).catch(() => {});
    }
    return () => {
      platform.audio.stop();
      setFreddy({ speaking: false });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResponseBubble, name]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-sb-surface select-none [-webkit-touch-callout:none]">
      {/* Always-on custom cursor for the whole Freddy lesson — hides the
          OS pointer and renders the tool-aware sprite (glove/cutter)
          plus the pointing-glove swap over data-cursor-pointing elements.
          Mounted at the Mount level so the cursor stays correct across
          Explore → V2 → V3 without each phase having to re-wire it. */}
      <ToolCursorLayer />
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

      <div className="absolute inset-x-0 bottom-6 grid place-items-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <NameInputOverlay
            open={inOnboarding}
            onSubmit={handleNameSubmit}
            pulse={nameInputPulsing}
          />
        </div>
      </div>

      {useMachineMode ? (
        onboardingDone && name ? (
          <LessonMachineRoot name={name} platform={platform} />
        ) : null
      ) : explorationDone && name ? (
        // Lesson stage routing:
        // - skipToV3 (?lesson=v3): straight to V3, no V2.
        // - skipToScripted (?lesson=scripted): V2 only, no auto-advance.
        // - default (no URL param): V2 with a "Continue to lesson →"
        //   affordance that advances into V3 in-place. First-time
        //   learners flow through both; returning learners arrive here
        //   with the URL param set by the landing details view.
        skipToV3 || scriptedDone ? (
          <LessonV3
            name={name}
            cv={platform.cv}
            progress={platform.progress}
            sessionId={sessionId}
          />
        ) : (
          <LessonScripted
            name={name}
            cv={platform.cv}
            onContinue={skipToScripted ? undefined : () => setScriptedDone(true)}
          />
        )
      ) : (
        <LessonExploration
          name={name ?? ""}
          active={onboardingDone && !!name}
          onComplete={() => setExplorationDone(true)}
          cv={platform.cv}
        />
      )}
    </main>
  );
}

// Back-compat alias for the Phase 2 shim in src/modules/lesson/LessonView.tsx
export { FreddyMount as LessonView };

function LessonMachineRoot({
  name,
  platform,
}: {
  name: string;
  platform: LessonMountProps["platform"];
}) {
  const [searchParams] = useSearchParams();
  const { enabled: demoMode } = useDemoMode();
  const [state, send] = useMachine(tutorMachine, {
    input: { name },
    inspect: getInspectorOption(),
  });
  const { setFreddy } = useTutorStore();

  useEffect(() => {
    const beat = searchParams.get("beat");
    if (beat === "aha") send({ type: "RESET" });
    if (beat === "win") send({ type: "WIN_DEMO" });
  }, [searchParams, send]);

  const activeDialogueKey = dialogueKeyForState(state.value);
  const ahaTriggered = state.matches({ aha: "aha_triggered" });
  const winActive = state.matches("win");

  useEffect(() => {
    if (state.matches({ aha: "setup" })) {
      platform.audio.preload("aha_compare_prompt");
      platform.audio.preload("aha_wrong_slice");
    }
  }, [state, platform.audio]);

  void setFreddy; // consumed by tutorMachine internally

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

      <AhaAnimation
        active={ahaTriggered}
        onDone={() => send({ type: "ANIMATION_DONE" })}
      />

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
