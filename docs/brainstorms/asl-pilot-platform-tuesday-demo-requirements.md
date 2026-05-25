---
date: 2026-05-25
topic: asl-pilot-platform-tuesday-demo
---

# SuperTutors Tuesday-Demo Platform Slice (ASL Pilot + Cross-Lesson Visibility + Auth)

## Summary

Tuesday-demo-ready SuperTutors slice: Supabase email/password auth gates a redesigned landing-as-dashboard (Hero + 3-lesson grid + cross-lesson activity feed), plus the ASL lesson's full-viewport practice screen (phonological hint card on fail, on-demand reference video on repeat fail) over a focused 5–10 sign trained subset. Freddy Fractions adapts to the same universal Item / Attempt / Mastery data model so the dashboard reads as a unified platform, not an ASL app with a sidebar.

---

## Problem Frame

SuperTutors is positioned as a lesson-server platform where named tutors follow state-driven pedagogical arcs and adapt to what they observe (via answers or computer vision). The platform exists today as a clean lesson-server architecture with one shipped lesson (Freddy Fractions) and two stubs (Acutis Institute, ASL ComputerVision). The ASL lesson is the immediate forcing function: a Gauntlet AI partner-project pilot brief requires a browser-based ASL learning app that recognizes 75–100 beginner signs, returns pass/fail with confidence thresholds, surfaces targeted hints on failure, supports learner accounts, and tracks progress over time — all by Tuesday morning, with a video walkthrough due Monday 11:59pm.

The deeper context: this is not an ASL-pilot demo, it is an Acutis-pitch demo with ASL and Freddy as proof-of-capability. The audience is Patrick Skinner at Superbuilders, who has a creative-director role open. The author's strengths are design, UX, and platform architecture — not deep ML rigor. The product strategy (see [STRATEGY.md](../../STRATEGY.md)) locks ASL as supporting actor, and the cross-lesson visibility / unified platform feel as the differentiator.

The platform today has zero auth, zero user accounts, zero persistence layer, and a landing page (Embla carousel of 3 lesson cards) that reads as marketing rather than learning-platform. The ASL Mount is a `ComingSoonMount` stub. To make the platform-narrative land, the home surface must be redesigned as a learning dashboard (landing-as-dashboard pattern), real auth + DB must be wired, and the ASL lesson must ship a competent, beautifully designed practice loop that demonstrates the fail → hint → pass beat the strategy depends on.

---

## Actors

- A1. **K-12 Student** — primary learner. Signs in, practices ASL signs (and Freddy fractions), sees their own progress on the dashboard.
- A2. **Parent (buyer / spectator)** — pays for SuperTutors; sees the same dashboard the student sees (no separate parent surface, by design — see [STRATEGY.md](../../STRATEGY.md)).
- A3. **Sage (ASL tutor character)** — present as lesson identity on the dashboard card, as the framing voice on hint cards ("Sage suggests…"), and on the pass beat; deliberately NOT a persistent in-camera avatar during practice.
- A4. **Demo evaluator (Patrick Skinner)** — out-of-product actor, in-product implication: the demo flow is designed for his perspective.

---

## Key Flows

- F1. **Sign-in to dashboard**
  - **Trigger:** Unauthenticated user lands on `/` and clicks "Sign in"
  - **Actors:** A1 (or A4 as demo proxy)
  - **Steps:** click Sign in → modal with email/password → submit → page re-renders as signed-in state with hero + 3-lesson grid + activity feed populated
  - **Outcome:** Authenticated session; dashboard renders with real progress data
  - **Covered by:** R1, R2, R3, R5, R6

- F2. **Practice an ASL sign — happy path**
  - **Trigger:** Signed-in learner clicks ASL lesson card from dashboard
  - **Actors:** A1, A3
  - **Steps:** lesson loads → camera permission prompt → practice screen mounts with first sign prompted → learner signs → model returns confidence above pass threshold → pass beat → auto-progress to next sign
  - **Outcome:** Sign mastered (or attempt logged); next sign prompted
  - **Covered by:** R13, R16, R17, R20

- F3. **Practice an ASL sign — fail → hint → retry → pass**
  - **Trigger:** Signed-in learner signs incorrectly
  - **Actors:** A1, A3
  - **Steps:** model returns fail (or confident-wrong) → phonological hint card emerges with handshape/location/movement/palm-orientation breakdown → learner retries with hint visible → model returns pass → pass beat
  - **Outcome:** Sign passed after correction; hint efficacy logged
  - **Covered by:** R13, R18, R19, R20

- F4. **Practice an ASL sign — repeat fail → on-demand reference**
  - **Trigger:** Learner fails multiple times with phonological hint visible
  - **Actors:** A1
  - **Steps:** hint card persists → learner clicks "Show me the sign" → reference video plays inline → learner retries → eventual pass or skip
  - **Outcome:** Learner has reference visual; not forced into auto-skip
  - **Covered by:** R19, R21

- F5. **Cross-lesson activity rollup**
  - **Trigger:** Learner completes a session in any lesson and returns to `/`
  - **Actors:** A1
  - **Steps:** dashboard renders → recent-activity feed shows the new session alongside prior cross-lesson activity → lesson card updates with new counters / mastery
  - **Outcome:** Dashboard reflects cross-lesson progress in real time (or on next load)
  - **Covered by:** R6, R8, R9, R10

---

## Requirements

**Authentication & Account**
- R1. The application MUST support email/password sign-up and sign-in.
- R2. Learners MUST be able to return to their saved practice history across sessions (project brief Req 11).
- R3. A pre-seeded demo account with substantial practice history MUST exist for Tuesday's demo.
- R4. Signed-out users CAN view the landing page; clicking into any lesson MUST prompt sign-in before lesson content loads.

**Landing-as-Dashboard Surface**
- R5. The landing route (`/`) MUST serve both signed-out and signed-in states on the same canvas with different content / framing.
- R6. The signed-in state MUST render: a personalized hero (with a Continue-CTA into the most-recently-active lesson), a 3-lesson grid (ASL, Freddy, Acutis-Coming-Soon) with per-lesson progress bars and key counters, and a cross-lesson recent-activity feed.
- R7. The signed-out state MUST render: the same canvas in a marketing variant with sample/aspirational copy and Sign-in / Get-started CTAs.

**Universal Data Model**
- R8. The system MUST track per learner per lesson: items attempted, pass/fail outcomes, number of attempts, current mastery state, and recent practice history (project brief Req 12).
- R9. The data model MUST be lesson-agnostic — ASL vocabulary signs and Freddy fraction questions resolve to the same Item / Attempt / Mastery primitives.
- R10. Freddy Fractions MUST be adapted to write into the universal data model.

**ASL Catalog & Recognition**
- R11. The ASL catalog MUST contain 75–100 beginner vocabulary items appropriate for ASL 1 learners, sourced from ASL-LEX (project brief Req 2).
- R12. The trained recognition model MUST cover a curated 5–10 sign subset with phonological diversity (varied handshapes, locations, movements).
- R13. The model MUST return pass / fail / uncertain via documented confidence thresholds; uncertain predictions MUST NOT be marked as pass (project brief Req 9).
- R14. For non-trained vocabulary items presented to the learner, the model MUST return "uncertain — try again" with a general hint, never pass.
- R15. The trained-vs-catalog gap MUST be documented in the pilot-quality doc (project brief Req 8).

**ASL Practice Screen**
- R16. The practice screen MUST be a full-viewport camera feed with overlaid UI; overlays MUST NOT occlude the learner's hands during the attempt state.
- R17. The screen MUST persistently display: the current sign prompt and an ambient recognition / confidence cue.
- R18. On fail, a phonological hint card MUST emerge with structured handshape / location / movement / palm-orientation breakdown drawn from ASL-LEX data (project brief Req 10).
- R19. The hint card MUST persist through retries until the learner passes or skips, and MUST include an on-demand "Show me the sign" affordance that reveals a reference video for the target sign.
- R20. On pass, a visual pass beat MUST fire, followed by auto-progress to next sign (or completion if last).
- R21. The learner MUST be able to skip any sign at any time; skipped signs are marked "needs practice" in the mastery state.

**Privacy, Camera, Documentation**
- R22. Camera frames MUST stay local during normal practice sessions; the application MUST NOT upload raw video by default (project brief Req 13).
- R23. The application MUST gracefully handle camera-access-denied, camera-unavailable, and unsupported-browser cases (project brief Req 4).
- R24. The pilot submission MUST include documentation covering: product scope, model approach, dataset approach, validation criteria, privacy assumptions, known limitations, and pretrained-model evidence (project brief Req 15).

---

## Acceptance Examples

- AE1. **Covers F1, R2, R3, R5, R6.** Given a signed-out user on `/`, when they click "Sign in" and submit the pre-seeded demo account credentials, then they are returned to `/` rendered in its signed-in state with the personalized hero, 3-lesson grid (each showing real progress data), and recent-activity feed populated.
- AE2. **Covers F2, R13, R20.** Given a signed-in learner on the ASL practice screen with a trained sign prompted, when they correctly sign the prompt and the model returns confidence above the pass threshold, then the pass beat fires and the next sign auto-loads.
- AE3. **Covers F3, R13, R18, R19, R20.** Given a signed-in learner who signs incorrectly, when the model returns a confident-wrong or fail result, then the phonological hint card emerges with the target sign's handshape / location / movement / palm-orientation breakdown and persists through retry attempts until the learner passes the sign.
- AE4. **Covers F4, R19.** Given a learner with the phonological hint card visible, when they click "Show me the sign," then a reference video plays inline showing the correct sign formation.
- AE5. **Covers R14.** Given a learner prompted with a non-trained vocabulary item from the catalog, when they sign anything, then the result returns "uncertain — try again" with a general hint, never a pass.
- AE6. **Covers R4, R5, R7.** Given an unauthenticated visitor on `/`, when they click into a lesson card, then they see a sign-in prompt before lesson content loads.
- AE7. **Covers F5, R6, R8, R9, R10.** Given a learner who completes a Freddy Fractions session and returns to `/`, when the dashboard renders, then the recent-activity feed shows the Freddy session alongside prior ASL sessions in chronological order, and the Freddy lesson card's counters reflect the new attempt.
- AE8. **Covers R23.** Given a user whose browser does not have camera access permitted, when they enter the ASL practice screen, then they see a clear instruction to grant camera access (and the practice attempt state is not entered).

---

## Success Criteria

- A learner can sign in, complete an ASL vocabulary practice session, see pass/fail with targeted hints, and return to a populated dashboard.
- Patrick reads the platform as a unified product (not an ASL app with a sidebar) within the first 30 seconds of the demo.
- The fail → hint → pass beat lands as the demo's most distinctive moment in the ASL section.
- The pilot-quality doc honestly documents the trained-vs-catalog gap, so brief-compliance pushback has a credible answer.
- The plan handed to `ce-plan` resolves implementation sequencing without inventing product behavior, scope boundaries, or success criteria.

---

## Scope Boundaries

- **Voice input across all lessons; voice output for the ASL lesson.** Freddy's voice output stays.
- **Acutis lesson content and the brainlift pitch deck.** Separate user-owned workstream; this brainstorm covers only the platform plumbing that hosts a future Acutis lesson (Coming Soon card today).
- **Separate parent-only dashboard or parent surface.** Student-first by design per STRATEGY.md.
- **Mobile-specific layouts.** Desktop demo only; mobile is post-Tuesday.
- **Multi-language sign support, classroom rostering, SSO, server-side CV inference, production-scale rate-limiting / multi-region / advanced multi-tenant isolation beyond Supabase defaults.** Mostly listed in the project brief's out-of-scope section; included here for traceability.
- **Persistent Sage character avatar embedded in the camera feed during practice.** Recovered via lesson card identity, hint card framing ("Sage suggests…"), and the pass beat.
- **Separate `/dashboard` route.** Landing-as-dashboard pattern; IA stays flat: `/` and `/lessons/:slug`.
- **Auto-skip after N fails.** Repeat-fail flow is persistent-hint + on-demand reference; learner-controlled.

---

## Key Decisions

- **Auth shape: Supabase Auth + Postgres with email/password.** Real auth + real DB pay off twice (auth and progress storage in one). Email/password over OAuth/anonymous: universal recognizability, simpler Supabase config, no OAuth provider setup. Pre-seeded demo account handles the demo's first-impression moment.
- **Landing-as-dashboard over a separate `/dashboard` route.** IA stays flat. The "watch this surface come alive after sign-in" transformation replaces a "here's the dashboard" reveal as the demo wow beat. Inherits chrome work already shipped.
- **Hero + 3-Lesson Grid + Activity Feed layout pattern** (vs Spotify-style multi-shelf or hero-mini-shelves hybrid). Tight, scannable, max design control per pixel — best for creative-director audition. Multi-shelf reads sparse with 3 lessons; hero-hybrid pulls focus toward one lesson.
- **Phonological hint card on the practice screen (vs persistent Sage avatar).** Pedagogy-forward; less design surface to nail; honors the strategy's "structured perception" half of the approach. Sage's character presence is recovered through lesson-card identity, hint framing, and pass beat.
- **Trained subset 5–10 signs, catalog 75–100.** ASL is supporting actor per STRATEGY.md. Trained-vs-catalog gap documented honestly per project brief Req 8. Saved hours go to landing redesign and practice-screen polish.
- **Repeated-fail behavior: persistent hint + on-demand reference video.** Learner agency over forced escalation. ASL-LEX example videos cover the trained subset for free.

---

## Dependencies / Assumptions

- ASL-LEX 2.0 dataset is available locally at `ASL-ComputerVision/References/ASL-LEX 2.0/` (~2,700 signs with phonological annotation + 88 example videos). Gitignored — runtime usage requires extracting the relevant subset.
- WLASL dataset is available locally at `ASL-ComputerVision/References/WLASL-dataset/` (2,000 sign folders, video clips). Gitignored.
- Supabase free tier is sufficient for demo scale; no OAuth provider config required.
- The decision on MediaPipe Hands vs. from-scratch landmark detection is deferred to planning. The strategic posture is "competent supporting actor, document trade-offs honestly," which permits either path given proper pilot-quality-doc framing. (Project brief Req 7 prohibits pretrained landmark detectors strictly read; Freddy already uses MediaPipe; pragmatic interpretation is documented.)
- The Acutis brainlift document is the user's separate workstream and will appear in the demo via the Acutis Coming Soon card and verbal pitch, not as in-product content.
- Target browser for Tuesday's demo: desktop Chrome / Edge / Safari latest. Mobile is post-demo.
- The Supabase project (URL, anon/publishable key) will be provisioned by the user or as a planning step.

---

## Outstanding Questions

### Resolve Before Planning

(None — all macro product decisions were resolved in brainstorm.)

### Deferred to Planning

- [Affects R8, R9] [Technical] Supabase schema design — `profiles`, `lesson_sessions`, `attempts`, `mastery` tables; relations; indexes; row-level-security policies.
- [Affects R12, R13] [Technical, Needs research] Recognition model architecture — MediaPipe Hands landmarks + custom classifier (fastest, bends Req 7) vs. from-scratch CNN on cropped frames (strict Req 7 compliance, slower). Decision depends on planning research into training tractability with WLASL data and demo-day reliability targets.
- [Affects R12, R18] [Technical] Specific 5–10 sign selection from ASL-LEX with phonological diversity (which handshapes / locations to showcase in hint demos). Filter joins ASL-LEX phonological columns with WLASL availability.
- [Affects R17, R20] [Design] Confidence display treatment and pass-beat treatment (animation, sound, copy, auto-progress timing). Design-during-implementation.
- [Affects R6, R7] [Design] Hero copy and visuals for both states; what the Continue-CTA says when there is no active lesson.
- [Affects R3] [Plan-level] Demo-seeding script — what practice history to pre-populate (which signs passed, which needed hints, how many sessions, when).
