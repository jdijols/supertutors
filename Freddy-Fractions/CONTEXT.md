# Freddy Fractions — Glossary

Terms used in this workstream. Glossary only — no implementation
details, no specs. See [LESSON-V3.md](./LESSON-V3.md) for the current
lesson arc and [PRD.md](./PRD.md) for the product spec.

## Containers & recipients

### DeliveryBox
A **singleton, off-screen "send away" affordance**. The kid drags a
pizza or slice onto it; the lid closes, the whole box slides off-
screen right, and a fresh empty box slides in to replace it. Contents
are never visible on-screen — the metaphor is "the delivery person
takes this away." Used in v2 onboarding for the delivery tour.

Lives in `scenes/world/` as viewport-fixed UI.

### GuestBox *(V3, new component — not a DeliveryBox extension)*
A **multi-instance pizza box on the table** that *retains* the slices
dragged into it. Renders contents stacked inside the open lid so the
kid can count portions ("Maya's box: 2 wholes + 1 half").

Reuses DeliveryBox's *visual assets* (open/closed PNG, hover-glow
filter, AABB overlap math) but is a **separate primitive** with its
own state derivation (filters `pieces` by `guestId`). Lives in
`scenes/table/` alongside Pizza and PizzaPiece.

**One `GuestBox` per guest** (1:1, not per pizza). Contents stack
stylized inside the lid — multiple wholes + halves + quarters can
share one box even when that breaks real-world pizza-box physics. The
box is a *labeled portion container* for the kid's mental model, not
a literal pizza box. Layout inside the box should be grid-like (rows
of slices) so contents are countable at a glance, even when overlap is
needed for density.

**Not the same as DeliveryBox.** DeliveryBox sends slices away;
GuestBox holds them. They co-exist; DeliveryBox stays untouched.

**Future-proof:** if usability testing shows kids are bothered by "2
wholes in one box looks wrong," the data model supports evolving to
multi-box-per-guest rendering with zero schema change — `guestId`
stays the same; GuestBox just split-renders into N visual boxes.

### Guest
A pure character sprite (`scenes/world/Guest.tsx`) with three
expression states: `neutral`, `frown`, `smile`. Canonical guest IDs:
`maya`, `theo`, `nonna` (shipped art) and `nico` *(V3, added for
scene 4's 4-friend math — ships with `Guest.tsx`'s colored-circle
placeholder; real PNG queued as follow-up)*. Pure render — does not
hold pieces.

A `GuestBox` may visually pair with a `Guest` (the named character
standing beside their box) but the box owns the slice state, not the
character.

## Pieces

### guestId *(field on SandboxPiece, V3)*
Optional `string` on each `SandboxPiece` recording which guest's
portion this slice belongs to. `undefined` means the slice is "free"
on the table (not yet distributed). When a piece is sliced, children
inherit the parent's `guestId`. When a piece is dragged out of a
`GuestBox` back onto the table, `guestId` clears.

"In a box" and "free" are mutually exclusive — there is no third
state. The same `guestId` is shared across all of a guest's slices,
even when they would physically exceed one pizza box's capacity (see
`GuestBox`).

## Lesson primitives

### MCQ *(V3, new primitive)*
A multiple-choice question component. Renders 2–6 chip buttons; the
kid taps one. Behavior on wrong answer is configured per-beat via a
`mode` prop:

- **`mode: "any-advances"`** — any answer fires `onAnswer(choice)` and
  the state machine advances. Freddy may react in-character to wrong
  picks via a follow-up line. Used for silly distractors and Yes/No
  checkpoints where both routes are valid.
- **`mode: "re-prompt-until-correct"`** — wrong answer triggers a hint
  line from Freddy; the kid picks again. Only `onAnswer(correct)`
  advances the state machine. Used for genuine comprehension checks
  where the wrong answer reveals a misconception that should be
  corrected, not papered over.
