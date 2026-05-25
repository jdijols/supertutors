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
| 2 friends at a table         | 2 named pizza boxes (extends existing `DeliveryBox`)              | 🟡 extend      |
| 4 friends at a table         | 4 named pizza boxes                                                | 🟡 extend      |
| Drag-to-share (free)         | Free drag + proximity grouping                                    | ✅ exists       |
| Snap-to-person sharing slots | Box-as-recipient: drop a slice on a box, it's "in" that box       | 🟡 extend      |
| Slice click                  | Cutter gesture (existing)                                         | ✅ exists       |
| Mode toggle (slice ↔ share)  | Tool toggle exposed to kid (was hidden in v2)                     | 🟡 expose      |
| Multiple-choice chips        | New `<MCQ />` primitive                                           | ❌ build        |
| Yes/No chips                 | `<MCQ />` variant                                                 | ❌ build        |
| Numerator/denominator entry  | New `<FractionInput />` primitive (two numeric inputs + bar)      | ❌ build        |
| Mixed-number display (2 ½)   | New `<MixedNumberDisplay />`                                      | ❌ build        |
| Big numeral display ("2")    | Reuse typography from `<AhaAnimation />` family                   | 🟡 adapt       |
| Sidebar challenge panel      | Existing speech bubble or new pinned `<ChallengeCard />`          | 🟡 decide      |
| Down-arrow continue button   | New `<ContinueButton />`                                          | ❌ build        |

**Net new primitives:** `MCQ`, `FractionInput`, `MixedNumberDisplay`,
`ContinueButton`. **Four.** Plus an extension of the existing
`DeliveryBox` into `GuestBox` (named lid, drop-target state) — no new
art, just behavior + a label.

**Pizza-box-as-guest** is the key simplification that drops the count
from six primitives to four-plus-one-extension. It's also more in-world:
Sicilian pizza shop → takeout boxes is native to our setting, where
character avatars at a table would feel grafted on. Freddy names the
boxes at scene-1 start ("These boxes are for your friends Sam and Pat")
so the kid still treats them as friends, not abstract bins. Slices
stacked in a labeled box are also more *countable* than slices
positioned near an avatar — ownership is unambiguous, which matters
when the kid is comparing portions to type `2 ½`.

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
codebase for an analogue and copy its chrome. MC chips → existing
landing-page chip styling. `FractionInput` numeric boxes → onboarding
name-entry field pattern. `ContinueButton` → reuse `NextArrow` if it
exists, otherwise match the lesson-complete `Play again` button.

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
for your friends Sam and Pat. Each one needs a fair share."

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
| 6 | f.png  | "What should we do with the extra cookie?" → **[Cut it in half] [Give it to the dog]**     | MC choice                                  |
| 7 | g.png  | "Great idea, let me get a knife." *(after Cut chosen)*                                      | (auto-advance after audio)                 |
| 8 | h.png  | "Click on a cookie to slice it in half."                                                    | Kid slices the leftover                    |
| 9 | i.png  | "Perfect." *(pizza now 2 halves)*                                                           | (auto-advance)                             |
| 10 | j.png | "Now divvy up that final cookie." + hand-icon hint                                          | Kid drags each half into a box             |
| 11 | k.png | "That's it." *(each box now contains 2 wholes + 1 half)*                                    | (auto-advance)                             |
| 12 | l.png | "How many cookies would you say each person got?" → **[Two] [Two and a half] [Three]**     | MC choice (correct: Two and a half)        |
| 13 | m.png | "Right. Two and a half cookies."                                                            | (auto-advance)                             |

### Scene 3 — Notation: whole + fraction (the symbolic leap)

| # | Screen | Dialogue / UI                                                                              | Interaction                                |
| - | ------ | ------------------------------------------------------------------------------------------ | ------------------------------------------ |
| 14 | n.png | "To write the number of whole cookies :"                                                    | (auto-advance, sets up beat 15)            |
| 15 | o.png | Big "**2**" numeral above the 2 whole pizzas. "We can just write the number 2. No problem." + continue | Kid taps continue                  |
| 16 | p.png | "But for the half cookie…" *(half-pizza image now beside the numeral 2)*                    | (auto-advance)                             |
| 17 | q.png | "We need a *fraction*."                                                                     | (auto-advance)                             |
| 18 | r.png | "Do you know how to write the fraction for one half?" → **[Yes] [No]**                     | MC (Yes/No — routes the same either way)   |
| 19 | s.png | "Go for it. What's *one half* written as a fraction?" + empty `[ _ / _ ]` input + hand hint | Kid types `1` and `2` into the boxes      |
| 20 | t.png | "That's it, ½." *(numeral becomes mixed number "2 ½")*                                       | (auto-advance)                             |
| 21 | u.png | "So each person has 2 ½ cookies." + continue                                                 | Kid taps continue                          |

### Scene 4 — Share 5 pizzas between 4 friends (introduces mode toggle + quarters)

**Scene preface (Freddy intro, our addition):** "Now Maya and Jordan
are joining Sam and Pat — that's four boxes for four hungry friends."

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
| 29 | zc.png | "This time the extra part is *half* of a *half*. Do you know what that's called?" → **[Quarter] [Third] [Fourth]** | MC (correct: Quarter)         |
| 30 | zd.png | "Bingo. It's a quarter cookie."                                                              | (auto-advance)                             |
| 31 | ze.png | "How many quarter cookies are there in a full cookie?" → **[1] [2] [3] [4] [5] [6]**        | MC (correct: 4)                            |
| 32 | zf.png | "Right. 4 quarters make one whole." *(4 quarters animate back into a whole)*                 | (auto-advance)                             |
| 33 | zg.png | "So if a quarter is 1 out of 4 pieces: Guess how we write the fraction for a quarter?" + empty `[ _ / _ ]` input + hand hint | Kid types `1` and `4`     |
| 34 | zh.png | "Nailed it."                                                                                  | (auto-advance)                             |
| 35 | zi.png | "Since a quarter is 1 out of 4 pieces: The fraction for a quarter is ¼." *(big "¼" numeral)* | Kid taps continue                          |
| 36 | zj.png | "Want to continue learning about fractions?" → **[Yes] [No]**                                | MC (lesson exit)                           |

---

## What this means for the stage machine

Today's [LessonScripted.tsx](../src/lessons/freddy-fractions/scripted/LessonScripted.tsx) has 14 stages and 1 dialogue type (Freddy talks, kid manipulates). V3 needs:

- **~36 stages** (one per beat) — but most are auto-advance-after-audio,
  same shape as `NEXT_AFTER_DONE` today
- **3 new stage *kinds*** the machine has to handle:
  1. `mc_pending` — waiting for kid's MC answer (gates on `onMCAnswer`)
  2. `fraction_input_pending` — waiting for kid to fill `[_/_]` (gates on `onFractionAnswer`)
  3. `continue_pending` — waiting for kid to tap the down-arrow
- **Mode toggle** becomes a kid-facing UI element (not just a Freddy-set `toolMode`)
- **Scene transitions** (1→2, 2→3, 3→4, 4→5) need cleanup/setup phases —
  pieces reset, box count changes (2→4 between scenes 3 and 4), mode
  toggle appears

The state-driven `tableState` pattern matching from v2 still works for
the manipulation beats (1, 4, 8, 10, 24, 25, 27); MC/input beats use
explicit answer callbacks instead.

---

## Implementation order (proposed)

1. **Build the new primitives in isolation** (`MCQ`, `FractionInput`,
   `MixedNumberDisplay`, `ContinueButton`) + extend `DeliveryBox` into
   `GuestBox` (named lid, drop-target state) — storybook-style page or
   in `src/lessons/freddy-fractions/scripted/_v3/`. Every primitive
   visually verified against the design-system constraints above before
   it's wired into the lesson.
2. **Wire scene 1 only** (beats 1–3) end-to-end as the smallest vertical
   slice that proves the new stage shape works (drag → 2 boxes →
   continue)
3. **Add scenes 2 + 3** (beats 4–21) — this is the meat: MC + fraction
   input + mode introduction
4. **Add scenes 4 + 5** (beats 22–36) — 4-box scaling + the quarter
   notation arc
5. **Record audio for all 36 beats** (ElevenLabs) — text is verbatim
   Synthesis (with cookies → pizzas swap); tune voice to Freddy in a
   follow-up pass
6. **A/B gate behind `?lesson=v3`** query param so v2 stays live until
   v3 is ready to flip

---

## Open questions

- **Box names — hard-coded or kid-typed?** Freddy hard-codes warm
  gender-ambiguous names (default: Sam + Pat → adds Maya + Jordan at
  scene 4), or kid types names at scene start (extra interactivity but
  delays the actual math), or boxes use neutral labels (Box A / B).
  Default plan: Freddy hard-codes. Easy to revisit.
- **Where do the new primitives live?** Lesson-local
  (`src/lessons/freddy-fractions/scripted/_v3/`) until they prove
  reusable, then hoist to `src/platform/ui/`. Default plan: local first.
- **What replaces the 30s stuck timer?** V2 fires `stuck_*` nudges
  after inactivity. V3 has more explicit waiting moments (MC, input) —
  probably needs nudges per-beat. Default plan: skip stuck timers in
  v3 first pass; add per-beat hint audio later.
- **MC "wrong answer" handling.** Synthesis screenshots don't show the
  wrong-answer path. Need to decide: does Freddy acknowledge and
  re-prompt, or does the kid only get the "right" buttons? Default
  plan: any answer advances; Freddy reacts appropriately and the
  lesson continues toward the same beat.
