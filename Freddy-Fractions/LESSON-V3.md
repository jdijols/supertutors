# Freddy Fractions — Lesson V3 (Synthesis-port arc)

A faithful port of the Synthesis "Share the Cookies" lesson into our
pizza-on-a-table primitive. The current v2 scripted arc (whole → halves
→ 2/4 = 1/2 AHA) is replaced wholesale by this longer, CPA-laddered
arc that ends with the kid *typing* `1/2` and `2/4` into fraction
boxes and seeing they describe the same physical thing.

**Source:** [References/Share the Cookies Lesson/](./References/Share%20the%20Cookies%20Lesson/) (37 screenshots, `a.png` → `zj.png`)
**Goal:** Beat-by-beat parity with Synthesis. Adapt only where our
primitives differ; preserve order, dialogue intent, and interaction type.

---

## Adaptation map (Synthesis → Freddy)

| Synthesis primitive          | Our primitive                                                     | Status         |
| ---------------------------- | ----------------------------------------------------------------- | -------------- |
| Cookies (whole circles)      | Sicilian pizzas (`SandboxPiece` with `fraction: "1" \| "1/2" …`)  | ✅ exists       |
| 2 friends at a table         | 2 `GuestBox` instances (new component; reuses DeliveryBox visuals) | ❌ build       |
| 4 friends at a table         | 4 `GuestBox` instances (canonical roster: maya, theo, nonna, nico) | ❌ build       |
| Drag-to-share (free)         | Free drag + proximity grouping                                    | ✅ exists       |
| Snap-to-person sharing slots | `GuestBox` is the drop-target — slice persists in its `pieces` state | ❌ build     |
| Slice click                  | Existing cutter — already supports **tap OR drag** while in cutter mode (see `PizzaPiece.tsx`); no gesture changes for V3 | ✅ exists       |
| Mode toggle (slice ↔ share)  | Existing `ToolPicker` (already kid-driven per PRD §3.3). `glove` ↔ "share"; `cutter` ↔ "slice." Beat 23 uses existing `spotlight === "toolpicker"` to pulse it. | ✅ exists       |
| Multiple-choice chips        | New `<MCQ />` primitive                                           | ❌ build        |
| Yes/No chips                 | `<MCQ />` variant                                                 | ❌ build        |
| Numerator/denominator entry  | New `<FractionInput />` primitive (two numeric inputs + bar)      | ❌ build        |
| Mixed-number display (2 ½)   | New `<MixedNumberDisplay />`                                      | ❌ build        |
| Big numeral display ("2")    | Reuse typography from `<AhaAnimation />` family                   | 🟡 adapt       |
| Sidebar challenge panel      | Existing speech bubble or new pinned `<ChallengeCard />`          | 🟡 decide      |
| Down-arrow continue button   | New `<ContinueButton />`                                          | ❌ build        |

**Net new primitives:** `MCQ`, `FractionInput` *(composes existing
`NumberBar` + `InputField`)*, `MixedNumberDisplay`, `ContinueButton`,
`GuestBox`. **Five.** `GuestBox` is a *new component* (not a
`DeliveryBox` extension) — different state model, different metaphor,
different location in the scene tree. It reuses DeliveryBox's *visual
recipe* (open/closed PNG, hover-glow filter, AABB overlap math) so no
new art is required. See [CONTEXT.md](./CONTEXT.md) for the GuestBox
vs DeliveryBox distinction.

**Pizza-box-as-guest** is the load-bearing scene simplification.
Sicilian pizza shop → takeout boxes is native to our setting; character
avatars at a table would feel grafted on. Slices stacked in a labeled
box are also more *countable* than slices positioned near an avatar —
ownership is unambiguous, which matters when the kid is comparing
portions to type `2 ½`. Freddy names the boxes at scene-1 start using
the canonical Guest roster (`maya`, `theo`, …) so each box reads as
"Maya's box," not "abstract bin A."

**Voice question (open):** Synthesis dialogue is terse ("Excellent.",
"Nice.", "Bingo.", "Nailed it."). Freddy's existing v2 voice is warmer
and more conversational. **Default plan: copy Synthesis text verbatim
into a first pass, then tune to Freddy's voice in a follow-up commit
once the arc plays end-to-end.** That keeps the port honest and
separates "does the structure work?" from "does it sound like Freddy?"

---

## Design system constraints

All new primitives pull from the existing token set already deployed to
production. No new colors, fonts, shadow recipes, or radii. (See
[DESIGN.md](../DESIGN.md) for the full token reference.)

- **Surfaces:** `bg-sb-paper`, `border-2 border-sb-ink`, `rounded-3xl`
- **Typography:** `font-mono` for chrome/labels/numerals/MC chips;
  `font-sans` for prose and speech-bubble text
- **Active-state rule:** active/ON → `bg-sb-ink text-white`; rest →
  `bg-sb-paper text-sb-ink` (the project's "active = dark" convention)
- **Shadows:** `shadow-sb-accent-deep/25` (never `shadow-black`)
- **Focus rings:** `focus-visible:ring-2 focus-visible:ring-sb-accent`
- **Viewport:** `h-[100dvh]` (never `h-screen` or `h-[100vh]`)
- **Motion:** Framer Motion `spring` (stiffness ~400–600, damping
  ~22–24) — matches the existing `Play again` button and lesson-complete
  card

**Pattern reuse:** before building a primitive, search the current
codebase for an analogue. MC chips → existing landing-page chip
styling. `FractionInput` → **compose existing `NumberBar` + `InputField`**
from `scenes/world/`; do **not** clone `NameInputOverlay`'s iPad-keyboard
pattern — that component's own comment says it is the *only* place in
the lesson where the system keyboard is allowed. Every other input is
in-world via NumberBar. `ContinueButton` → no analogue exists; build
new, matching the lesson-complete `Play again` button's chrome.

---

## Beat sheet (verbatim from Synthesis)

Every screen, in order. `[ID]` matches the screenshot filename.

**World substitutions (implicit throughout the dialogue):** Synthesis
"cookies" → our "pizzas"; Synthesis "characters at the table" → our
"named pizza boxes"; Synthesis "plate" → our "box." Dialogue is
otherwise verbatim Synthesis in this first pass; tuned to Freddy's
voice in a follow-up commit.

### Scene 1 — Share 4 pizzas between 2 friends (warm-up: clean division)

**Scene preface (Freddy intro, our addition):** "These two boxes are
for Maya and Theo — each one needs a fair share." *(Maya + Theo are
canonical `Guest` IDs with shipped art.)*

| # | Screen | Dialogue / UI                                                                              | Interaction                                |
| - | ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 1 | a.png  | "See if you can divide these cookies evenly."  *(4 pizzas floating, 2 named boxes on the table)* | Kid drags 2 pizzas into each box     |
| 2 | b.png  | "Excellent."                                                                                | (auto-advance after correct split)         |
| 3 | c.png  | "4 cookies ÷ 2 people = 2 cookies each." + down-arrow continue                              | Kid taps continue                          |

### Scene 2 — Share 5 pizzas between 2 friends (remainder + slice)

| # | Screen | Dialogue / UI                                                                              | Interaction                                |
| - | ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 4 | d.png  | "But how about 5 cookies ÷ 2 people? Try giving each person the same amount."              | Kid drags 2 each, 1 left over              |
| 5 | e.png  | "Nice. But there's one left-over." *(1 pizza hovering, 2+2 in boxes)*                       | (auto-advance)                             |
| 6 | f.png  | "What should we do with the extra cookie?" → **[Cut it in half] [Give it to the dog]**     | MC choice — `mode: any-advances` (silly distractor) |
| 7 | g.png  | "Great idea, let me get a knife." *(after Cut chosen)*                                      | (auto-advance after audio)                 |
| 8 | h.png  | "Click on a cookie to slice it in half."                                                    | Kid slices the leftover                    |
| 9 | i.png  | "Perfect." *(pizza now 2 halves)*                                                           | (auto-advance)                             |
| 10 | j.png | "Now divvy up that final cookie." + hand-icon hint                                          | Kid drags each half into a box             |
| 11 | k.png | "That's it." *(each box now contains 2 wholes + 1 half)*                                    | (auto-advance)                             |
| 12 | l.png | "How many cookies would you say each person got?" → **[Two] [Two and a half] [Three]**     | MC choice — `mode: re-prompt` (correct: Two and a half) |
| 13 | m.png | "Right. Two and a half cookies."                                                            | (auto-advance)                             |

### Scene 3 — Notation: whole + fraction (the symbolic leap)

| # | Screen | Dialogue / UI                                                                              | Interaction                                |
| - | ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 14 | n.png | "To write the number of whole cookies :"                                                    | (auto-advance, sets up beat 15)            |
| 15 | o.png | Big "**2**" numeral above the 2 whole pizzas. "We can just write the number 2. No problem." + continue | Kid taps continue                  |
| 16 | p.png | "But for the half cookie…" *(half-pizza image now beside the numeral 2)*                    | (auto-advance)                             |
| 17 | q.png | "We need a *fraction*."                                                                     | (auto-advance)                             |
| 18 | r.png | "Do you know how to write the fraction for one half?" → **[Yes] [No]**                     | MC — `mode: any-advances` (Y/N self-assessment; routes the same either way) |
| 19 | s.png | "Go for it. What's *one half* written as a fraction?" + empty `[ _ / _ ]` input + hand hint | Kid types `1` and `2` into the boxes      |
| 20 | t.png | "That's it, ½." *(numeral becomes mixed number "2 ½")*                                       | (auto-advance)                             |
| 21 | u.png | "So each person has 2 ½ cookies." + continue                                                 | Kid taps continue                          |

### Scene 3 → 4 break (our addition — scope=C decision)

**Inter-scene Y/N (between beats 21 and 22):**

| # | Screen | Dialogue / UI | Interaction |
| - | ------ | ------------- | ----------- |
| 21.5 | *(our addition, no source screenshot)* | "You just wrote your first fraction. Want to keep going to harder ones like quarters, or stop here for today?" → **[Keep going] [Stop here]** | MC — `mode: any-advances` (both routes are valid: Keep going → Scene 4; Stop here → completion card) |

If the kid picks **Stop here**, jump to a completion message
("Beautiful work — you learned that 2/4 = 1/2") and the `Play again`
button. Skip Scenes 4–5.

If the kid picks **Keep going**, proceed to Scene 4 as written below.

### Scene 4 — Share 5 pizzas between 4 friends (introduces mode toggle + quarters)

**Scene preface (Freddy intro, our addition):** "Nonna and Nico are
joining Maya and Theo — that's four boxes for four hungry friends."
*(`nico` added to the canonical roster as V3's 4th guest; ships with
`Guest.tsx`'s placeholder art, real PNG queued.)*

| # | Screen | Dialogue / UI                                                                              | Interaction                                |
| - | ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 22 | v.png | "Now we've got *5 cookies* and *4 people*." *(scene scales to 4 boxes; mode toggle appears at top)* | (auto-advance)                  |
| 23 | w.png | "Click up here to switch between slicing mode and sharing mode." *(arrow points to toggle)*  | (auto-advance after Freddy speaks)         |
| 24 | x.png | **Sidebar challenge:** "Share 5 cookies equally." + "See if you can divide the cookies equally." | Kid (in sharing mode) drags 1 to each → 1 left over |
| 25 | y.png | "If you need help, just click the hand." *(1 pizza hovering; mode now slice)*                | Kid slices the leftover                    |
| 26 | z.png | "Remember to click up here to switch between slicing cookies and sharing them." *(whole now in 4 quarters)* | Kid switches mode back to share |
| 27 | za.png | "You already cut the final cookie into 4 pieces. So just give each person a piece."         | Kid drags 1 quarter into each box          |
| 28 | zb.png | "Each person got a whole cookie, plus a little extra." *(each box: 1 whole + 1 quarter)*    | (auto-advance)                             |

### Scene 5 — Naming + writing the quarter (CPA closes for ¼)

| # | Screen | Dialogue / UI                                                                              | Interaction                                |
| - | ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 29 | zc.png | "This time the extra part is *half* of a *half*. Do you know what that's called?" → **[Quarter] [Third] [Fourth]** | MC — `mode: re-prompt` (correct: Quarter) |
| 30 | zd.png | "Bingo. It's a quarter cookie."                                                              | (auto-advance)                             |
| 31 | ze.png | "How many quarter cookies are there in a full cookie?" → **[1] [2] [3] [4] [5] [6]**        | MC — `mode: re-prompt` (correct: 4)        |
| 32 | zf.png | "Right. 4 quarters make one whole." *(4 quarters animate back into a whole)*                 | (auto-advance)                             |
| 33 | zg.png | "So if a quarter is 1 out of 4 pieces: Guess how we write the fraction for a quarter?" + empty `[ _ / _ ]` input + hand hint | Kid types `1` and `4`     |
| 34 | zh.png | "Nailed it."                                                                                  | (auto-advance)                             |
| 35 | zi.png | "Since a quarter is 1 out of 4 pieces: The fraction for a quarter is ¼." *(big "¼" numeral)* | Kid taps continue                          |
| 36 | zj.png | "Want to continue learning about fractions?" → **[Yes] [No]**                                | MC — `mode: any-advances` (lesson exit; either route exits) |

---

## Data model (V3 additions)

- **`SandboxPiece.guestId?: string`** — new optional field. Records
  which guest's portion a slice belongs to. `undefined` = free on the
  table. Sliced children inherit `guestId` from the parent.
  Drag-out-of-box clears it. See [CONTEXT.md](./CONTEXT.md) for the
  full definition.
- **One `GuestBox` per guest** (1:1, not per pizza). Contents stack
  stylized inside the lid in a grid-like layout; can hold multiple
  wholes + halves + quarters even when that breaks physics. The
  abstraction is "Maya's portion," not "Maya's literal pizza box."
- **Per-box composition derivation** reuses the v2 `deriveTableState`
  unchanged — just sliced per-guest instead of called once globally:
  ```ts
  const byGuest = groupBy(pieces, p => p.guestId ?? "free");
  const mayaState = deriveTableState(byGuest.maya ?? []);
  const theoState = deriveTableState(byGuest.theo ?? []);
  ```

---

## What this means for the stage machine

Today's [LessonScripted.tsx](../src/lessons/freddy-fractions/scripted/LessonScripted.tsx) has 14 stages and 1 dialogue type (Freddy talks, kid manipulates). V3 needs:

- **~36 stages** (one per beat) — but most are auto-advance-after-audio,
  same shape as `NEXT_AFTER_DONE` today
- **3 new stage *kinds*** the machine has to handle:
  1. `mc_pending` — waiting for kid's MC answer (gates on `onMCAnswer`)
  2. `fraction_input_pending` — waiting for kid to fill `[_/_]` (gates on `onFractionAnswer`)
  3. `continue_pending` — waiting for kid to tap the down-arrow
- **Mode toggle** is already kid-facing — existing `ToolPicker` is kid-driven per PRD §3.3. V3 keeps the v2 `TOOL_BY_STAGE` per-stage default-setting but the kid can override at any time. Beat 23 ("click up here to switch modes") uses the existing `spotlight === "toolpicker"` mechanism, not a new toggle.
- **Scene transitions** (1→2, 2→3, 3→4, 4→5) use **in-world flow**
  (Option B): old box contents fly to the existing `DeliveryBox`
  ("delivery person took them"); new pizzas slide in via existing
  `addPizza` motion (slide-from-oven); for 3→4, two new `GuestBox`
  instances slide in beside the existing two. Freddy narrates each
  transition in one short line. Notation overlays (scenes 3 & 5) keep
  the kid's distributed pieces visible beneath the big numerals — kid
  sees physical + symbolic together at the same moment.

The state-driven `tableState` pattern matching from v2 still works for
the manipulation beats (1, 4, 8, 10, 24, 25, 27); MC/input beats use
explicit answer callbacks instead.

### Hint policy (V3)

**Default per drag-distribution beat:**
- **Comprehension-heavy beats (10, 27)** — kid is encoding the math
  (drag halves to make 2½; drag quarters to make 1¼). Freddy fires a
  per-beat **audio hint** (Option B) after ~15s of wrong-config
  detected. Hint explains the gap, not just "try again."
- **Clean-distribution beats (1, 4, 24)** — straightforward division.
  Silent wait (Option A); v2's existing 30s `stuck_*` audio nudge
  fallback covers the truly-stuck case.
- **Per-beat visual override allowed.** A specific beat can opt into
  **visual feedback** (over-stuffed box wiggles; under-stuffed pulses
  — Option C) instead of, or alongside, audio. Decided per-beat as
  the lesson plays in practice; flagged inline in the beat sheet when
  a beat takes the override.

**Wrong-configuration recovery:** leave the table state as-is when the
hint fires. Kid re-drags to fix; the computer does not undo their
work. (Kids resent unintended state changes.)

---

## Implementation order (logical, not smallest-first)

**Approach: TDD throughout.** Unit tests for each step are written
*before* the step is executed. Order below follows logical dependencies
(data model first, then primitives, then end-to-end wiring), not
smallest-PR-first.

1. **Data model migration.** Add `guestId?: string` to `SandboxPiece`.
   Update consumers (Pizza, PizzaPiece, tableState, proximity,
   useSandboxPieces). Tests written first: slice-child-inherits-
   `guestId`; drag-out-clears-`guestId`; v2 lesson still passes
   end-to-end. (Pure refactor + new field; no new UI yet.)
2. **Build new primitives in isolation** (`MCQ`, `FractionInput`,
   `MixedNumberDisplay`, `ContinueButton`, `GuestBox`). Tests written
   first for each: correct behavior, design-system tokens met, CV mode
   pinch-target compatibility. Wired into a storybook-style preview
   page under `src/lessons/freddy-fractions/scripted/_v3/`.
3. **Wire Scene 1 + 1→2 transition** (beats 1–3 + first transition).
   Smallest end-to-end slice that exercises GuestBox + `guestId`
   filtering + the in-world transition flow. Tests written first for
   beat advancement on per-box composition match.
4. **Scenes 2 + 3** (beats 4–21) — MC + fraction input + notation
   overlay + the kid types `1/2`.
5. **Scene 3→4 break (beat 21.5) + Scenes 4 + 5** (beats 22–36) —
   stop-here Y/N, 4-box scaling, quarter notation arc, kid types `1/4`.
6. **Record audio for ~50 lines via ElevenLabs.** Starting budget ~$50;
   willing to top up. Text is verbatim Synthesis (cookies → pizzas
   swap) in the first pass; tune to Freddy's voice in a follow-up.
7. **A/B gate behind `?lesson=v3`** query param so v2 stays live during
   validation.
8. **Retire v2 after V3 validation.** Archive v2's `LessonScripted.tsx`
   and related stage files to a separate archive repo; flip V3 to the
   default scripted arc.

**CV mode** (camera/hand-tracking) inherits compatibility from v2 — the
existing `usePointerFromHand` emulates pointer events, and V3 doesn't
add any interaction type that bypasses the pointer layer. Verified
beat-by-beat in step 2 (each primitive's tests cover pinch-target
hit detection).

---

## Open questions

- **Box names — hard-coded or kid-typed?** Freddy hard-codes using the
  canonical Guest roster (Maya, Theo, Nonna, Nico — see CONTEXT.md),
  or kid types names at scene start (extra interactivity but delays
  the math), or boxes use neutral labels. Default plan: hard-coded
  canonical roster.
- **Where do the new primitives live?** Lesson-local
  (`src/lessons/freddy-fractions/scripted/_v3/`) until they prove
  reusable, then hoist to `src/platform/ui/`. Default plan: local first.
*(Stuck-timer question resolved by the Hint policy section above; MC
wrong-answer question resolved by the MCQ `mode` contract in
[CONTEXT.md](./CONTEXT.md).)*
