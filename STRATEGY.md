---
name: SuperTutors
last_updated: 2026-05-25
---

# SuperTutors Strategy

## Target problem

Today's AI tutors can only read text input — they can't perceive what the learner is doing and don't structure learning toward mastery, so all they can offer is text-shaped Q&A. For a K-12 beginner learning something hands-on (signing, fractions, anything you *do* and not just *answer*), there's no self-study option that can watch them and respond like a teacher would.

## Our approach

We build tutors as named characters that follow a state-driven pedagogical arc and adapt to what they observe — through answers or computer vision — so a lesson feels like a teacher who can see you, not a chatbot you type at.

## Who it's for

**Primary:** The K-12 student doing the lesson. They're hiring SuperTutors to see what they're getting better at and *own their own learning* — through lessons that observe what they actually do (CV, answers, mastery state) and surface a clear, honest picture of their progress in the same interface they learn in.

**Secondary:** Their parent (the buyer). They pay for SuperTutors to know their kid is making real progress without having to track it themselves; there's no separate parent dashboard — they see what the kid sees, by design.

## Key metrics

- **Lesson completion rate** — % of started lessons finished, per cohort. Measured in DB (session table).
- **Sessions per active student per week** — engagement habit signal. Measured in DB (session log).
- **D7 / W2 retention** — % of students still active 7 days / 2 weeks after first session. Measured in DB (user activity).
- **Hint recovery rate** — % of failed attempts that pass within N retries after a hint fires. Measured in DB (attempt log with hint flag).
- **Parent-perceived visibility** — qualitative read on whether parents trust the in-app progress view. Measured via short survey / interview.

## Tracks

### Lesson Server Platform

The shared infrastructure — registry, `LessonModule` contract, host, code-splitting, audio/CV/voice primitives — that every lesson plugs into.

_Why it serves the approach:_ Adding a new tutor is a single PR; pedagogical and character investment compounds across lessons instead of being rebuilt each time.

### Cross-Lesson Learner Experience

The student-facing surface that holds the lesson catalog, account, and progress view together — auth, navigation, and the in-interface visibility UI.

_Why it serves the approach:_ The student is the primary user; this is the layer where they own their own learning across whichever tutors they're working with.

### Per-Lesson Pedagogy + Character Engagement

Each lesson's teaching arc and its named character — the state-driven stages that build toward mastery (pedagogy), and the personality / voice / visual identity that makes the student want to come back (engagement).

_Why it serves the approach:_ This is where the approach is literally true — a lesson *is* a character following an arc that adapts to perception. Without this work, the platform is plumbing.

### Learning Visibility

The signal layer — CV processing, lesson state, attempt aggregation, mastery rollup logic — that turns what happens in a lesson into a clear, honest picture of progress.

_Why it serves the approach:_ The parent buys for visibility; the student owns their learning through it. Both halves of the persona depend on this being good.
