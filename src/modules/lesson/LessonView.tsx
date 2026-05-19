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
        {/* Freddy stands BEHIND the counter — large, bottom-anchored to
            the viewport so his lower body extends into the counter zone.
            The RestaurantScene's foreground counter mask (z-20) cuts him
            visually at the counter line, giving real chef-behind-bar depth.
            Onboarding uses the OK greeting gesture; later beats swap to
            neutral / excited / thinking via the state machine. */}
        <div className="absolute left-2 md:left-8 bottom-0 z-10">
          <FreddyCharacter
            pose="facing_student"
            gesture="ok"
            mouth={showGreetingBubble || showResponseBubble ? "open" : "closed"}
            className="h-[88vh] md:h-[100vh] w-auto"
          />
        </div>
      </RestaurantScene>

      {/* Speech bubbles — z-30 to render ABOVE the counter mask.
          Positioned BELOW Freddy's face so the bubble partially overlaps
          the counter, with the tail pointing UP-LEFT to his face. Avoids
          the conflict between tail and his raised OK-gesture hand.
          TODO (future iteration): position bubble dynamically based on
          who's speaking (Freddy vs. guests) and what visual elements
          are present on the counter. */}
      <div className="absolute left-[20%] md:left-[26%] bottom-[35vh] md:bottom-[42vh] max-w-md z-30">
        <SpeechBubble
          open={showGreetingBubble}
          speaker="Freddy"
          tailSide="top-left"
          onTap={() => setGreetingDismissed(true)}
        >
          Heyyy, welcome to SuperSlice! I&apos;m Freddy Fractions — c&apos;mon
          back behind the counter, we got work to do. What&apos;s your name,
          kid?
        </SpeechBubble>
        <SpeechBubble
          open={showResponseBubble}
          speaker="Freddy"
          tailSide="top-left"
        >
          {name}! Beautiful name. Alright {name}, lemme show ya how this
          works.
        </SpeechBubble>
      </div>

      {/* Name input overlay — onboarding only, centered. z-50 stays above
          everything (including the counter mask). One-time system
          keyboard exception per PRD §3.8.1. */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <NameInputOverlay
            open={inOnboarding && greetingDismissed}
            onSubmit={handleNameSubmit}
          />
        </div>
      </div>

      {/* Bottom-LEFT: NumberBar (z-40 above counter mask). Hidden until
          XState wires real input focus events in the next round. */}
      <div className="absolute bottom-6 left-6 z-40">
        <NumberBar
          open={false}
          onDigit={() => undefined}
          onDelete={() => undefined}
        />
      </div>

      {/* Bottom-RIGHT corner: ToolPicker (z-40 above counter mask).
          Hidden until XState wires manipulative interaction. */}
      <div className="absolute bottom-6 right-6 z-40">
        <ToolPicker visible={false} />
      </div>
    </main>
  );
}
