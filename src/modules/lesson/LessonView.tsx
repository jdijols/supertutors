import { useState } from "react";
import { useAppStore } from "@/store/appStore";
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
 * Layout (per design decision 2026-05-19):
 *   - RestaurantScene fills the screen (chef's POV behind the counter)
 *   - FreddyCharacter positioned right-of-center, slightly back-of-counter
 *   - Speech bubbles overlay anchored to speakers (Freddy / guests)
 *   - NumberBar bottom-LEFT (visible only when an InputField is focused)
 *   - ToolPicker bottom-RIGHT corner
 *   - NameInputOverlay: centered modal during onboarding (only place the
 *     system keyboard is allowed; one-time)
 *
 * State (this scaffold turn): local React state simulates the onboarding
 * flow so the layout is testable end-to-end. The XState lesson machine
 * (stately/lesson.ts) wires up the real driver in the next round.
 */
export function LessonView() {
  const name = useAppStore((s) => s.name);
  const setName = useAppStore((s) => s.setName);

  // Local UI state — simulates onboarding without XState for now.
  const [greetingDismissed, setGreetingDismissed] = useState(false);
  const [responseShown, setResponseShown] = useState(false);

  const inOnboarding = !name;
  const showGreetingBubble = inOnboarding && !greetingDismissed;
  const showResponseBubble = !inOnboarding && responseShown;

  function handleNameSubmit(submitted: string) {
    setName(submitted);
    setGreetingDismissed(true);
    setResponseShown(true);
    // Auto-dismiss response bubble after a beat (simulating audio length)
    window.setTimeout(() => setResponseShown(false), 3000);
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-mozzarella-50">
      <RestaurantScene>
        {/* Freddy stands behind the counter, right-of-center. */}
        <div
          className="absolute left-1/2 top-1/2 -translate-y-1/2"
          style={{ transform: "translate(20%, -40%)" }}
        >
          <FreddyCharacter
            pose="facing_student"
            mouth={showGreetingBubble || showResponseBubble ? "open" : "closed"}
            speaking={showGreetingBubble || showResponseBubble}
          />
        </div>

        {/* Greeting bubble (onboarding) */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2">
          <SpeechBubble
            open={showGreetingBubble}
            speaker="Freddy"
            tailSide="right"
            onTap={() => setGreetingDismissed(true)}
          >
            Heyyy, welcome to SuperSlice! I&apos;m Freddy Fractions — c&apos;mon
            back behind the counter, we got work to do. What&apos;s your name,
            kid?
          </SpeechBubble>
        </div>

        {/* Response bubble (post-name) */}
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2">
          <SpeechBubble
            open={showResponseBubble}
            speaker="Freddy"
            tailSide="right"
          >
            {name}! Beautiful name. Alright {name}, lemme show ya how this
            works.
          </SpeechBubble>
        </div>
      </RestaurantScene>

      {/* Name input overlay — onboarding only, centered.
          One-time system keyboard exception per PRD §3.8.1. */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <div className="pointer-events-auto">
          <NameInputOverlay
            open={inOnboarding && greetingDismissed}
            onSubmit={handleNameSubmit}
          />
        </div>
      </div>

      {/* Bottom-LEFT: NumberBar (hidden in onboarding; will be driven by
          XState in later phases). Demoed visible here so layout is verifiable. */}
      <div className="absolute bottom-6 left-6">
        <NumberBar
          open={!inOnboarding}
          label="Numerator"
          onDigit={(d) => console.info(`[demo] digit ${d}`)}
          onDelete={() => console.info("[demo] delete")}
        />
      </div>

      {/* Bottom-RIGHT corner: ToolPicker. Hidden during onboarding. */}
      <div className="absolute bottom-6 right-6">
        <ToolPicker visible={!inOnboarding} />
      </div>
    </main>
  );
}
