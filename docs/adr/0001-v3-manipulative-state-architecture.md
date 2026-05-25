# 0001 — V3 manipulative-state architecture (Freddy Fractions)

## Status

Accepted — 2026-05-25

## Context

Freddy Fractions V3 is a port of the Synthesis "Share the Cookies"
lesson onto our existing Sicilian-pizza manipulative. V3 introduces
two capabilities the v2 scripted arc never had:

- **Share among named guests** — slices are distributed to specific
  recipients (Maya, Theo, Nonna, Nico) rather than sent off-screen via
  the existing `DeliveryBox`. This requires per-recipient state on the
  manipulative.
- **Symbolic fraction entry** — the kid types `1/2`, `2/4`, `1/4` into
  numerator/denominator boxes, completing the concrete → pictorial →
  abstract (CPA) ladder. v2 ended at the AHA animation with no
  symbolic step.

The grilling session that produced this ADR (see `CONTEXT.md` and
`Freddy-Fractions/LESSON-V3.md` for the full glossary and beat sheet)
surfaced four decisions that look counter-intuitive without context
and could be "fixed" by a future maintainer into broken states. This
ADR exists so that fix attempt never happens.

## Decision

### 1. `GuestBox` is a new component, not a `DeliveryBox` extension

`GuestBox` (the per-guest recipient on the table) and `DeliveryBox`
(the off-screen send-away affordance) share visual assets but have
**opposite state semantics**:

| Aspect              | DeliveryBox                        | GuestBox                                     |
| ------------------- | ---------------------------------- | -------------------------------------------- |
| Multiplicity        | Singleton                          | One per guest (multi-instance)               |
| Position            | `fixed right-[-6px]` viewport edge | On the table, positioned per scene           |
| Contents on screen  | Never visible                      | Always visible (stacked inside open lid)     |
| Lid behavior        | Closes + slides off + replenishes  | Stays open; contents accumulate              |
| State model         | Stateless container                | Holds `pieces` filtered by `guestId`         |
| Scene namespace     | `scenes/world/`                    | `scenes/table/`                              |

We made GuestBox a separate primitive that *copies the visual recipe*
(open/closed PNG, hover-glow filter, AABB overlap math) but lives in
`scenes/table/` with its own state derivation.

### 2. One `GuestBox` per guest, 1:1, with stylized stacking inside

A real pizza box holds one pizza. Maya gets 2 wholes + 1 half — that's
physically three pizza boxes. We deliberately use **one** `GuestBox`
per guest and stack contents stylized inside, even when that exceeds
real-world capacity.

The box is a **labeled portion container** for the kid's mental model
("Maya's portion"), not a literal pizza box. Kids count *pizzas*
inside, not boxes. Multi-box-per-guest rendering would add visual
clutter and drop-target ambiguity that hurts the math more than the
physics realism helps.

### 3. `guestId?: string` field on `SandboxPiece`

When a slice is dropped into Maya's box, that ownership is tracked
via a new optional `guestId` field directly on `SandboxPiece`, not in
a sidecar `Map`. Sliced children inherit `guestId` from their parent.
"In a box" and "free on the table" are mutually exclusive — dragging
a piece out of a box clears the field.

This preserves the v2 principle that *the world is the source of
truth, not the event history* — there is one canonical `pieces` array,
filtered per-guest at render and at state-derivation time:

```ts
const byGuest = groupBy(pieces, p => p.guestId ?? "free");
const mayaState = deriveTableState(byGuest.maya ?? []);
```

### 4. Scope = C: ship all 36 beats with a mid-lesson "stop here" Y/N

V3 runs ~5–7 minutes — the upper edge of a 9-year-old's single-session
attention span. Rather than split into two registry-level lessons
(V3a + V3b, fragmenting the CPA spiral) or trust the kid to stay
engaged for the full arc, we inserted **beat 21.5** between Scene 3
(halves completed, kid types `1/2`) and Scene 4 (quarters introduced)
asking explicitly whether to continue or stop.

The kid has agency; short-attention sessions get a natural stopping
point with a real accomplishment; long-attention sessions still get
the full halves-then-quarters spiral in one go.

## Alternatives considered

| Decision | Rejected alternative | Why rejected |
|----------|---------------------|--------------|
| **1.** GuestBox = new | Extend `DeliveryBox` with `mode: "send-off" \| "hold"` prop | Two opposing state models in one component; high regression risk to v2 onboarding flow |
| **1.** GuestBox = new | Use existing `Guest` character sprite as the recipient | `Guest` is a pure render with no piece-holding logic; user prefers in-world pizza boxes over avatars |
| **2.** 1:1 stacking | One box per pizza (multi-box per guest, derived from contents) | Visual clutter; drop-target ambiguity; kid mentally unions boxes; counterproductive when the lesson goal is counting pizzas, not boxes |
| **2.** 1:1 stacking | Default 1 box + "+1 box" affordance when contents exceed 1 pie | Adds a "new box appeared" moment that distracts mid-distribution |
| **3.** `guestId` field | Sidecar `Map<pieceId, guestId>` outside `pieces` | Two sources of truth must sync on delete / slice / move — exactly the drift bug v2's state-driven philosophy was built to avoid |
| **3.** `guestId` field | `GuestBox.pieces: SandboxPiece[]` (boxes own pieces) | Pieces no longer canonical; state machine must merge N arrays; slice across array boundaries is awkward |
| **4.** Stop-here break | Ship all 36 with no break (Option A) | Kid who flags mid-lesson loses the symbolic-leap moment at the end |
| **4.** Stop-here break | Split into two registry-level lessons V3a + V3b (Option B) | Fragments the cross-denominator spiral; doubles the product surface |

## Consequences

**Positive**

- v2 stays untouched — `DeliveryBox`, v2's `LessonScripted.tsx`, and
  the existing `ToolPicker` behavior all continue working during V3
  development (A/B-gated behind `?lesson=v3`).
- One canonical `pieces` array preserves v2's "world is the source of
  truth" architecture; per-guest derivation is a one-line `groupBy`.
- GuestBox can evolve to multi-box-per-guest rendering later (if
  usability testing reveals a need) with zero schema change — the
  `guestId` field stays the same; only the render strategy changes.
- Mid-lesson break respects kid attention without splitting the
  product surface or fragmenting the CPA spiral.

**Negative — future-maintainer surprises**

- Two pizza-box components in the codebase (`DeliveryBox`,
  `GuestBox`) with similar visuals but opposite semantics. See
  `Freddy-Fractions/CONTEXT.md` for the distinction; do **not**
  combine them.
- `SandboxPiece` type now has an optional `guestId` field that is
  `undefined` in most v2 contexts — every consumer of the type must
  handle the optional explicitly.
- `GuestBox` will sometimes render visually-impossible contents
  (e.g., 2 whole pizzas in one box). This is **deliberate**, not a
  layout bug — see decision #2.
- Beat 21.5 is the only lesson beat in the SuperTutors codebase where
  one MC button leads to a different ending state than the other.
  Cutting it would silently degrade short-attention UX.

## References

- [Freddy-Fractions/LESSON-V3.md](../../Freddy-Fractions/LESSON-V3.md) — full beat sheet, design system constraints, implementation order
- [Freddy-Fractions/CONTEXT.md](../../Freddy-Fractions/CONTEXT.md) — glossary (DeliveryBox, GuestBox, Guest, guestId, MCQ)
- Existing primitives referenced: `src/lessons/freddy-fractions/scenes/world/DeliveryBox.tsx`, `Guest.tsx`, `NumberBar.tsx`, `InputField.tsx`, `ToolPicker.tsx`
