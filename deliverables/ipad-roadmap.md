# SuperTutors — iPad Roadmap
**Draft for Superbuilders interview / portfolio review — 2026-05-22**

---

## What this document is

A sketch of what SuperTutors (Freddy Fractions and the full SuperTutors family) looks like as a shipped iPad product — not just a demo. Written for the Superbuilders team and specifically for Patrick Skinner, who built BEMO and thinks deeply about physical-digital learning pipelines.

---

## The product premise

**Synthesis Tutor, but with physical manipulatives and a CV pipeline.**

Synthesis proved that adaptive, game-like math tutoring works at scale. BEMO proved that physical-digital fusion produces qualitatively different learning. SuperTutors tries to combine both — a Synthesis-style choreographed lesson arc with OSMO/BEMO-style physical interaction, running entirely in the browser with no hardware dependency.

The v1 vertical slice: **fraction equivalence (1/2 = 2/4)** for Grade 3. The hero interaction: the kid slices a Sicilian pizza with a webcam-tracked pinch gesture, drags pieces together, and discovers that 2/4 = 1/2 without being told.

---

## Current state (shipped by 2026-05-22 noon)

| Layer | Status |
|---|---|
| Pizza manipulative (slice + drag + proximity detection) | ✅ Shipped |
| Beat 6 (AHA) state machine + animation | ✅ Shipped |
| Voice pipeline (ElevenLabs, name personalization) | ✅ Shipped |
| CV physical mode (MediaPipe Hands, pinch gesture) | ✅ Shipped |
| Demo mode + beat-skip shortcuts | ✅ Shipped |
| Guest character placeholders | ✅ Shipped (art pending) |
| Remaining beats (1, 3, 4, 5, 7, 8) state machines | 🔲 Needs Stately authoring |
| iPad real-device verification | 🔲 Needs physical device |
| Win confetti + slice particle effects | 🔲 Polish phase |
| Character art (Freddy expressions, 3 guests × 3 expressions) | 🔲 Pending Midjourney |

---

## v1.0 — Ship to TestFlight / PWA (30-day sprint)

**Goal:** A complete, playable fraction-equivalence lesson that works on iPad Safari. No app store yet — distribute as a PWA with Add to Home Screen.

### What ships

**Full 8-beat lesson arc:**
1. Splash — kid enters name, Freddy greets them by name (already wired)
2. Sandbox — free exploration of the pizza mechanics before instruction starts
3. Vocab — Freddy introduces "fractions" by counting slices a guest ordered
4. First Guest — Maya arrives, wants "half a pizza"
5. Two Guests — Theo and Nonna Lucia arrive, need equal shares
6. AHA — kid discovers 2/4 = 1/2 via the comparison gesture (already shipped)
7. Check — one or two follow-up problems to consolidate understanding
8. Win — celebration screen, Freddy throws a party

**Physical CV mode as an opt-in toggle** (already shipped — see README). Not the default; works on any device with a camera.

**Character art** — 3 guests × 3 expressions + Freddy × 5 expressions. Prompt library drafted (see `assets/midjourney-prompts.md`).

**PWA manifest + offline support** — lesson should work on airplane (no ElevenLabs), falling back to text-only bubbles if network unavailable.

### What doesn't ship in v1.0

- Multi-child profiles / parent dashboard
- Analytics / learning data collection
- Additional fraction concepts (thirds, mixed numbers, improper fractions)
- Additional tutor characters beyond Freddy

---

## v1.5 — Parent flow + profile (60-day sprint)

**Goal:** A parent can set up a child, pick a starting level, and see what the child worked on.

### Parent onboarding

- Account creation (email + password or Sign in with Apple)
- Add child profile: name, age, grade level, optional avatar
- Pick starting lesson (fractions, multiplication coming next)

### Child experience

- Named personalization already works (ElevenLabs name stitching)
- Kid sees their name on the home screen: "Hi Maya, ready to cook?"
- Lesson history persisted — no need to restart every time

### Parent dashboard (v1 — minimal)

- "Today Maya completed Beat 6 — Fraction Equivalence aha moment"
- Time spent, lesson progress, current beat
- No CV data tracked — privacy-first posture

---

## v2.0 — CV learning analytics (3-month sprint)

**The BEMO thesis extended.**

Patrick's insight: every physical interaction is a data point. The hesitation before a correct answer is as valuable as the answer itself. v2 starts recording gesture patterns and using them to adapt the lesson pacing.

### CV event stream

Each hand-tracking session logs (locally, on-device):
- `PINCH_INITIATED` — when the pinch gesture starts
- `SLICE_COMMITTED` — when a pinch release produces a slice
- `DRAG_DURATION` — how long the kid held pieces together before releasing
- `COMPARISON_HESITATION` — time between proximity condition met and COMPARISON event fired

None of this leaves the device without explicit opt-in.

### Adaptive pacing

The state machine already has a `wrong_slice` recovery path. v2 extends it:
- If the kid takes > 30 seconds to initiate the first slice → Freddy offers a hint
- If the kid makes 3 wrong slices → machine short-circuits to "show me" mode where Freddy does one example
- Fast kids (Beat 6 in < 60 seconds) get a bonus: "Want to try with thirds? Pizza Margherita has three equal slices…"

### Multi-lesson arc

Fraction equivalence → fraction addition → fraction comparison → mixed numbers. Each lesson adds a new pizza variant and a new guest.

---

## v2.5 — SuperTutors family

Freddy Fractions is Tutor #1. The `SuperTutors` platform already has routing for multiple tutors (see `LandingPage` — placeholder cards are stubbed). v2.5 ships Tutor #2.

**Candidate #2 — Spelling Sam (or similar):** letter tiles on a baking sheet, physically rearrange to spell a word. Exactly the BEMO-style interaction Patrick's team has been building. The CV pipeline from Freddy Fractions plugs straight in — same `useHandLandmarks()` hook, different gesture vocab.

---

## What I want to build with Superbuilders

1. **The CV pipeline at scale.** Right now it's a demo. A production pipeline needs: model versioning, device performance profiling (M3 iPad Pro vs. old A12 iPad), graceful fallback to mouse/touch, telemetry on gesture recognition accuracy.

2. **The parent flow.** Nobody's cracked seamless parent onboarding for educational apps without making it feel like a homework assignment. The data from `DRAG_DURATION` and `COMPARISON_HESITATION` is valuable but only if parents trust where it goes.

3. **The curriculum layer.** Right now the state machine is hand-authored in Stately. For a multi-lesson curriculum, we need a content layer — probably a lightweight DSL or config format — so curriculum designers can author lessons without modifying TypeScript.

4. **The BEMO pipeline question.** Patrick's original insight was that you train the CV model on the richest data first (failing students, edge cases) and then dial down complexity. How does that apply to a web-based, MediaPipe-backed pipeline? Is there a fine-tune path? A curriculum-driven annotation loop?

---

## Open questions for the Superbuilders conversation

- What's the intended first market? Individual families (DTC) or schools (B2B)? The state machine approach is very tutor-centric; if it's B2B, do teachers want to see the lesson arc or just drop-in exercises?
- What's the privacy posture on CV data from children? COPPA implications are serious. The current "everything on-device" approach sidesteps most of it but limits the analytics ceiling.
- Is the BEMO pipeline in TypeScript/React already, or is it a separate native stack? The `useHandLandmarks()` hook could be open-sourced as a starting point for the web layer.
- Timeline to a shippable multi-lesson product — is 60 days realistic for v1.5?

---

*Written 2026-05-22. If this is still accurate 30 days from now, we didn't move fast enough.*
