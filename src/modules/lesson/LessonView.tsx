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
        {/* Freddy stands behind the counter on the LEFT, with the
            speech bubble appearing to his right at head height.
            Onboarding uses the OK greeting gesture; later beats switch to
            neutral / excited / thinking via the state machine. */}
        <div className="absolute bottom-8 left-8 md:left-12 flex items-end gap-2 md:gap-6 z-10">
          <FreddyCharacter
            pose="facing_student"
            gesture="ok"
            mouth={showGreetingBubble || showResponseBubble ? "open" : "closed"}
            className="w-56 md:w-80 h-auto"
          />

          {/* Bubble container — pushed up to head height via mb-* */}
          <div className="mb-32 md:mb-56 max-w-md">
            <SpeechBubble
              open={showGreetingBubble}
              speaker="Freddy"
              tailSide="left"
              onTap={() => setGreetingDismissed(true)}
            >
              Heyyy, welcome to SuperSlice! I&apos;m Freddy Fractions — c&apos;mon
              back behind the counter, we got work to do. What&apos;s your name,
              kid?
            </SpeechBubble>
            <SpeechBubble
              open={showResponseBubble}
              speaker="Freddy"
              tailSide="left"
            >
              {name}! Beautiful name. Alright {name}, lemme show ya how this
              works.
            </SpeechBubble>
          </div>
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

      {/* Bottom-LEFT: NumberBar — hidden until XState wires real input
          focus events in the next round. */}
      <div className="absolute bottom-6 left-6">
        <NumberBar
          open={false}
          onDigit={() => undefined}
          onDelete={() => undefined}
        />
      </div>

      {/* Bottom-RIGHT corner: ToolPicker — hidden until XState wires
          real manipulative interaction in the next round. */}
      <div className="absolute bottom-6 right-6">
        <ToolPicker visible={false} />
      </div>
    </main>
  );
}
