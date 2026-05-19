/**
 * SuperTutors lesson — canonical XState v5 machine.
 *
 * CANONICAL SOURCE for Stately authoring. One machine, five top-level
 * phases (matching the brief's explore → instruct → check arc, with
 * onboarding and celebrate bookends), each phase a compound state
 * with its own internal flow.
 *
 * TOP-LEVEL FLOW:
 *   onboarding → explore → instruct → check → celebrate (final)
 *
 * INTERACTION MODEL (per design decision 2026-05-19):
 *   - Full-bleed world (no chat panel). Freddy and guests live in the
 *     RestaurantScene. Speech is shown as bubbles anchored to the speaker
 *     and auto-dismissed when audio finishes.
 *   - Student input is never typed prose. Numeric input uses the on-screen
 *     NumberBar; selections use tappable buttons in the workspace;
 *     gestures (slice, drag, tap-to-count) happen on pizzas/slices directly.
 *   - One exception: the kid's NAME is entered once via the system keyboard
 *     during onboarding. Every other lesson input is in-world UI.
 *
 * Round-trip:
 *   1. Copy the entire createMachine(...) call below.
 *   2. In Stately Editor → Code tab, paste it (replacing existing code).
 *   3. Author dialogue in state/transition `description` fields.
 *   4. Copy back from Stately's Code tab → paste over this file.
 *   5. Commit with message: `PT.3: <what changed>`
 *
 * Voice: Super Mario meets Jersey Shore. {{NAME}} = kid's name (stitched
 * at runtime per PRD §3.11).
 */
import { createMachine } from "xstate";

export const lessonMachine = createMachine({
  id: "supertutors_lesson",
  initial: "onboarding",
  context: {
    name: "",
  },
  types: {
    context: {} as { name: string },
    events: {} as
      | { type: "DIALOGUE_DONE" }
      | { type: "ANIMATION_DONE" }
      | { type: "NAME_ENTERED"; name: string }
      | { type: "SLICED"; pieceId: string; parentFraction: string }
      | { type: "PROXIMITY"; comparison: "equal" | "not_equal" }
      | { type: "TAPPED"; pieceId: string; hasTopping: boolean }
      | { type: "DELIVERED"; pieceId: string; guestId: string }
      | { type: "NUMBER_SUBMITTED"; fieldId: string; value: number }
      | { type: "CHOICE_SELECTED"; choiceId: string }
      | { type: "BUBBLE_DISMISSED" }
      | { type: "RESET" },
  },
  states: {
    // ─────────────────────────────────────────────────────────────────────
    // PHASE 1 — ONBOARDING
    // Goal: introduce Freddy + the world; capture the kid's name.
    // Pattern: world is already visible; Freddy waves, speech bubble pops
    // up, audio plays; bubble dismisses; name input field appears in
    // the workspace; kid types name (system keyboard, one-time); Freddy
    // responds with the name spoken aloud.
    // ─────────────────────────────────────────────────────────────────────
    onboarding: {
      description:
        "Phase 1 — Onboarding. The world is fully visible from second one: Freddy stands behind the SuperSlice counter, oven on the left, empty pizza table in front. Freddy waves and speaks; speech bubble overlays anchored to him.\n\n(TODO: J to refine in Stately.)",
      initial: "greeting",
      states: {
        greeting: {
          description:
            'World mounts; Freddy turns to face the student and waves. First speech bubble appears anchored to him with audio.\n\nFREDDY: "Heyyy, welcome to SuperSlice! I\'m Freddy Fractions — c\'mon back behind the counter, we got work to do. What\'s your name, kid?"',
          entry: "playDialogue.onboarding_greet",
          on: {
            DIALOGUE_DONE: { target: "awaiting_name" },
          },
        },
        awaiting_name: {
          description:
            "Speech bubble has dismissed. A name input field appears in the workspace (centered near Freddy). System keyboard slides up — this is the ONE time it's allowed. Kid types name and submits (return / enter / 'done').",
          on: {
            NAME_ENTERED: {
              target: "name_received",
              actions: "storeName",
            },
          },
        },
        name_received: {
          description:
            'Name MP3 is ready (pre-fetched during greeting via ElevenLabs Edge Function proxy — see PRD §3.11). Freddy responds, speaking the name aloud.\n\nFREDDY: "{{NAME}}! Beautiful name. Alright {{NAME}}, lemme show ya how this works."',
          entry: "playDialogue.onboarding_name_received",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        done: { type: "final" },
      },
      onDone: { target: "explore" },
    },

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 2 — EXPLORE
    // Goal: build familiarity with the manipulative + vocabulary.
    // Sub-phases: vocab (Count the Pepperoni) → sandbox (free play).
    // ─────────────────────────────────────────────────────────────────────
    explore: {
      description:
        "Phase 2 — Explore. Two sub-phases: (a) Count the Pepperoni for explicit numerator/denominator vocabulary, then (b) Sandbox for free play with tools and fraction toasts. Tools fade in during sandbox; remain visible (in right corner) for the rest of the lesson.",
      initial: "vocab",
      states: {
        vocab: {
          description:
            'Sub-phase 2a — Count the Pepperoni. A pizza slides out of the oven onto the counter, sliced into 4 with some pepperoni on some slices. Kid taps pepperoni slices to count (numerator), then taps the input field "?" → NumberBar appears → taps the count. Freddy reacts. Same for denominator.\n\n(TODO: J to author the counting sub-machine.)\n\nFREDDY (intro): "Before our first customer shows up, lemme show ya how we talk about pizzas around here. Take a look at this pizza — count the slices with pepperoni and tap the number."',
          initial: "intro",
          states: {
            intro: {
              entry: "playDialogue.explore_vocab_intro",
              on: { DIALOGUE_DONE: { target: "done" } },
            },
            // TODO: pepperoni_count_prompt, awaiting_numerator_input,
            // total_count_prompt, awaiting_denominator_input, vocab_reveal,
            // variation_1, variation_2
            done: { type: "final" },
          },
          onDone: { target: "sandbox" },
        },
        sandbox: {
          description:
            'Sub-phase 2b — Sandbox. Tools (glove + cutter) fade in to the right corner. NumberBar dismisses. Kid plays freely: slice pizzas, move pieces, see fraction toasts auto-appear over each new piece. Freddy gives warm reactions but doesn\'t direct.\n\n(TODO: J to author. Most complex sub-phase — many possible student actions. Exit trigger TBD: timer? min-actions? kid-tapped "ready" button?)\n\nFREDDY (intro): "Alright {{NAME}}, your turn — go on, slice some pizzas! Try different ways. I\'ll be right here."',
          initial: "playing",
          states: {
            playing: {
              entry: "playDialogue.explore_sandbox_intro",
              on: { DIALOGUE_DONE: { target: "done" } },
            },
            // TODO: free-play sub-states + toast triggers + ready signal
            done: { type: "final" },
          },
          onDone: { target: "done" },
        },
        done: { type: "final" },
      },
      onDone: { target: "instruct" },
    },

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 3 — INSTRUCT
    // Goal: guided practice that builds to the AHA.
    // Sub-phases: first_order → two_orders → equivalence_reveal.
    // The AHA lives here as the climax, not as a peer top-level beat.
    // ─────────────────────────────────────────────────────────────────────
    instruct: {
      description:
        "Phase 3 — Instruct. Guests arrive at the counter from the far side. Kid prepares orders (slice + deliver via glove). Difficulty escalates: single guest → two guests with equal share → equivalence problem.",
      initial: "first_order",
      states: {
        first_order: {
          description:
            'Sub-phase 3a — First customer. A single guest approaches the counter. Asks for a simple share. Kid slices, delivers via glove tool, guest smiles. First win.\n\n(TODO: J to author. Linear with one wrong-amount branch.)\n\nFREDDY: "Oh hey, our first customer just walked in! Listen to what they want."\nGUEST: "Hiya — could I please have HALF the pizza?"',
          initial: "guest_arrival",
          states: {
            guest_arrival: {
              entry: "playDialogue.instruct_first_arrival",
              on: { DIALOGUE_DONE: { target: "done" } },
            },
            // TODO: order_spoken, awaiting_delivery, delivered_correct,
            // delivered_wrong, guest_satisfied
            done: { type: "final" },
          },
          onDone: { target: "two_orders" },
        },
        two_orders: {
          description:
            "Sub-phase 3b — Second customer arrives. Both guests want equal pizza. Kid figures out halves for both.\n\n(TODO: J to author. Linear with proportional-wrong branches.)",
          initial: "guest_arrival",
          states: {
            guest_arrival: {
              entry: "playDialogue.instruct_two_arrival",
              on: { DIALOGUE_DONE: { target: "done" } },
            },
            // TODO: order_spoken, awaiting_delivery, both_satisfied,
            // unequal_branch
            done: { type: "final" },
          },
          onDone: { target: "equivalence_reveal" },
        },
        equivalence_reveal: {
          description:
            "Sub-phase 3c — THE AHA. A third guest arrives wanting the same amount as the others, but the kid is running low on whole pizzas. Freddy nudges them to slice differently. Kid discovers that two quarters equal one half. Cinematic reveal with snap-align + glow + chime.\n\nSee PRD §5.1 + §5.1.1. Specific sub-states (setup precondition, waiting_for_slice, wrong_slice, stuck, sliced_correctly, waiting_for_compare, not_equal, stuck_compare, aha_triggered, celebrating) to be authored in Stately by J.\n\n(TODO: J to author all sub-states in Stately. This is the load-bearing climax — invest authoring time here.)",
          initial: "intro",
          states: {
            intro: {
              entry: "playDialogue.instruct_aha_intro",
              on: { DIALOGUE_DONE: { target: "done" } },
            },
            // TODO: third_guest_arrival, ran_low_revelation, waiting_for_slice,
            // wrong_slice, stuck, sliced_correctly, waiting_for_compare,
            // not_equal, stuck_compare, aha_triggered, celebrating
            done: { type: "final" },
          },
          onDone: { target: "done" },
        },
        done: { type: "final" },
      },
      onDone: { target: "check" },
    },

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 4 — CHECK
    // Goal: mastery confirmation through 2-3 independent problems.
    // Uses tap-input fields + NumberBar for numeric answers; uses
    // drag-to-compare for proximity proofs.
    // ─────────────────────────────────────────────────────────────────────
    check: {
      description:
        'Phase 4 — Check for understanding. 2-3 short problems testing the equivalence concept. Mix of numeric inputs (NumberBar) and drag-to-compare gestures. Branching dialogue on wrong answers stays warm and re-teaches.\n\n(TODO: J to author 2-3 problem sub-machines.)\n\nFREDDY (intro): "Alright {{NAME}}, let\'s see if you got it. Just a couple little challenges."',
      initial: "intro",
      states: {
        intro: {
          entry: "playDialogue.check_intro",
          on: { DIALOGUE_DONE: { target: "done" } },
        },
        // TODO: problem_1 (e.g., "Show me 2/4 next to 1/2 — are they equal?"),
        // problem_2 (e.g., numeric: "How many eighths equal one half?"),
        // problem_3 (stretch)
        done: { type: "final" },
      },
      onDone: { target: "celebrate" },
    },

    // ─────────────────────────────────────────────────────────────────────
    // PHASE 5 — CELEBRATE
    // Goal: win moment that ties back to narrative + reinforces mastery.
    // ─────────────────────────────────────────────────────────────────────
    celebrate: {
      description:
        'Phase 5 — Celebrate. All guests smile and face the student. Full-screen confetti via tsparticles. Freddy turns to the student with his biggest grin and delivers the final reinforcement.\n\nFREDDY: "{{NAME}}, you did it! Look at all these happy customers — every one of them got their fair share, all because YOU figured out that one half equals two quarters. You\'re officially a fractions champion. Mama mia. Bellissimo!"',
      initial: "guests_react",
      states: {
        guests_react: {
          description:
            "All guests face the student with happy expressions. Camera holds for ~1s. No dialogue yet.",
          entry: "triggerGuestsReact",
          on: {
            ANIMATION_DONE: { target: "confetti" },
          },
        },
        confetti: {
          description:
            "tsparticles confetti preset bursts across the screen. Audio chime.",
          entry: "triggerConfetti",
          on: {
            ANIMATION_DONE: { target: "freddy_final" },
          },
        },
        freddy_final: {
          description: "Freddy delivers the final reinforcement line by name.",
          entry: "playDialogue.celebrate_freddy_final",
          on: {
            DIALOGUE_DONE: { target: "done" },
          },
        },
        done: {
          description:
            "Lesson complete. App may offer 'play again' or return to landing.",
          type: "final",
        },
      },
      type: "final",
    },
  },

  on: {
    // Lesson-wide events
    RESET: { target: ".onboarding" },
  },
});
