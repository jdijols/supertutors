# Progress Dashboards, V3 Voicing, and a Production Ship

**Date:** Tuesday, May 26, 2026 at 01:49 AM CDT
**Session focus:** Build the signed-in lesson dashboard, lock the mastery rule engine, wire V3 attempt recording, voice the V3 curriculum, then merge + deploy.

---

## TL;DR

Built the signed-in landing UX from data layer to pixels: pure `computeMasteryStatus` function (sticky, ASL = 3-consecutive ∨ 5/6 window, Freddy = single pass), per-lesson expand-in-place details view via framer-motion `layoutId`, hybrid V2→V3 sequential flow for first-time learners with dual CTAs for returning ones, full V3 attempt recording, and 36 V3 dialogue lines voiced through ElevenLabs (50 new MP3s). Merged `origin/main` (DarkPageHeader work from another branch) into the feature line cleanly, pushed both remotes, and Vercel rolled production.

---

## Critical Decisions

- **Sticky mastery for V1** — once `mastered`, stays mastered regardless of subsequent fails. Simpler, defensible, and the "X mastered" count stays stable; review surfacing can come from recent activity in V2 rather than badge regressions.
- **ASL mastery rule = (3 consecutive passes) OR (5/6 sliding window)** — strict enough that lucky guesses don't trigger, forgiving enough for one stray miss after a streak. CV's `uncertain` and `skip` results are filtered as noise before the rule runs.
- **Freddy mastery rule = any single pass per problem** — V3's MCQ/FractionInput items are one-shot, not repeated practice; pass-once matches the lesson shape.
- **Hybrid V2 ↔ V3 over single-mode** — first-time learners flow V2 (sandbox play) → V3 (structured curriculum) in one continuous session; returning learners get a details view with two CTAs ("Continue lesson" → V3, "Explore sandbox" → V2). V2 alone is "play", V3 alone is "learn", together they match the brand's play→formalize pattern.
- **Expand-in-place over route-based detail page** — framer-motion `layoutId` makes shared-layout transition tractable; the spatial connection between card and details preserves the bento feel that a `/progress/:slug` route would lose.
- **Hints stay text-only for V1 voicing** — only the 36 V3 `speech` callbacks were voiced; the 5 `hintOnWrong` strings remain on-screen text to bound the ElevenLabs spend and avoid Freddy talking past the kid's mistake.
- **MuteToggle + CvToggle: icon-only state, no color inversion** — both are utility chrome (audio/camera on-off). The `active = dark` rule still applies to `ToolPicker` (gameplay-critical state) and lesson-world feedback, but utility toggles read as quieter preferences.
- **TTS-friendly text rewrites** in `dialogue.json` — `÷` → "divided by", `½` → "one half", `¼` → "one fourth" so the voice doesn't stumble on symbols.

## Big Changes / Pivots

- **About card became a fully clickable card** — earlier in the session the card was a passive colophon; later it became a `motion.button` mirroring the lesson cards, with `Jason Dijols` carved out via `stopPropagation` for the LinkedIn link.
- **Removed Freddy's inline progress bar** — the "X / Y mastered" sub-bar on the FreddyPosterCard was scrapped once the expand-in-place details view became the home for all metrics. Inline progress on the card was redundant.
- **Sign-in button retreated from primary to secondary chrome** — originally shipped as a paper-filled cream button (visually co-equal with MuteToggle); user flagged the top-right felt heavy. Switched to ghost treatment (faint stroke, transparent bg) following BrainliftViewer's secondary pattern.
- **Card order experimented and reverted** — tried About top-left / Freddy top-right / Sage bottom-left / BrainLift bottom-right, then BrainLift bottom-left / Sage bottom-right, then back to the original diagonal balance (BrainLift TL, ASL TR, Freddy BL, About BR). Original wins on weight balance + reading order for a hiring audience.
- **Merge from `origin/main` mid-flight** — three commits landed on main from another worktree (`DarkPageHeader` extraction) while this branch was active. Merged cleanly; `WorkflowPage.tsx` now uses the shared component.

## Files Created / Modified

**Mastery rule engine**
- [`src/platform/progress/mastery.ts`](src/platform/progress/mastery.ts) — pure `computeMasteryStatus(itemId, recentAttempts, existingStatus)`; sticky short-circuit; lesson dispatch via item prefix; noise filter.
- [`src/platform/progress/mastery.test.ts`](src/platform/progress/mastery.test.ts) — 24 tests across sticky, ASL Rule A, Rule B, Freddy, skip/uncertain, unknown lessons.
- [`src/platform/progress/InMemoryProgressClient.ts`](src/platform/progress/InMemoryProgressClient.ts) — refactored `recordAttempt` to fetch last 6 attempts and call the rule.
- [`src/platform/progress/SupabaseProgressClient.ts`](src/platform/progress/SupabaseProgressClient.ts) — same refactor, parallel query for existing mastery + recent attempts.

**Landing expand-in-place + dashboards**
- [`src/platform/landing/LessonDetailsView.tsx`](src/platform/landing/LessonDetailsView.tsx) — new full-bento expanded view: hero block, 3-stat tiles, progress bar, by-item grid (adaptive density), Esc/× close, primary + optional secondary CTAs.
- [`src/platform/landing/LandingPage.tsx`](src/platform/landing/LandingPage.tsx) — `expandedSlug` state, framer-motion `layoutId` + `AnimatePresence`, sibling fade-out, click routing (signed-out → modal; no mastery → navigate; has mastery → expand). Entrance cascade still in place (3x slower per user pref).
- [`src/platform/landing/BrainliftCard.tsx`](src/platform/landing/BrainliftCard.tsx) — portrait poster with Carlo Acutis image + linear gradient; "Saint Carlo Acutis Institute" title; `Superbuilders` inline link → superbuilders.dev (lowercase b, stopPropagation).
- [`src/platform/landing/AboutCard.tsx`](src/platform/landing/AboutCard.tsx) — now a `motion.button` navigating to `/workflow`; "A Jason Dijols project" with LinkedIn carve-out; diagonal hatch matching siblings.
- [`src/platform/landing/FreddyPosterCard.tsx`](src/platform/landing/FreddyPosterCard.tsx) — Freddy scaled up + repositioned (apron crops at bottom); titles "Learn / FRACTION / EQUIVALENCE"; ~10 min estimate; inline progress prop removed.
- [`src/lessons/asl/ASLPosterCard.tsx`](src/lessons/asl/ASLPosterCard.tsx) — Sage character image replaces hand glyph; "Learn / AMERICAN / SIGN LANGUAGE"; "with **Sage** and your camera right at home"; ~15 min estimate.

**Workflow page (new route)**
- [`src/platform/workflow/WorkflowPage.tsx`](src/platform/workflow/WorkflowPage.tsx) — `/workflow` route, editorial skeleton with stub sections (post-merge: uses shared `DarkPageHeader`).
- [`src/main.tsx`](src/main.tsx) + [`src/App.tsx`](src/App.tsx) — route + inline-chrome detection.

**Auth chrome**
- [`src/platform/auth/SignInButton.tsx`](src/platform/auth/SignInButton.tsx) — secondary ghost chrome between UserMenu and MuteToggle.
- [`src/platform/auth/SignInDialog.tsx`](src/platform/auth/SignInDialog.tsx) — tab resets to `sign-in` on every open.

**Utility chrome rules**
- [`src/platform/ui/MuteToggle.tsx`](src/platform/ui/MuteToggle.tsx) — icon-only state across both surfaces; `surface` prop only affects focus-ring offset.
- [`src/lessons/freddy-fractions/scenes/world/CvToggle.tsx`](src/lessons/freddy-fractions/scenes/world/CvToggle.tsx) — same treatment, comment updated.
- [`DESIGN.md`](DESIGN.md) — surface-dependent inversions section split into utility chrome vs functional toggles; 2026-05-26 decision-log entry.

**Freddy V2 ↔ V3 hybrid**
- [`src/lessons/freddy-fractions/catalog.ts`](src/lessons/freddy-fractions/catalog.ts) — 5 V3 assessment items + `V3_STAGE_TO_ITEM` map.
- [`src/lessons/freddy-fractions/Mount.tsx`](src/lessons/freddy-fractions/Mount.tsx) — starts a `freddy-fractions` session; adds `scriptedDone` state for V2 → V3 in-place transition; threads progress + sessionId into V3.
- [`src/lessons/freddy-fractions/scripted/LessonScripted.tsx`](src/lessons/freddy-fractions/scripted/LessonScripted.tsx) — `Continue to lesson →` button in the done card + `Skip to lesson →` chip in chrome (both gated by `onContinue` prop).
- [`src/lessons/freddy-fractions/scripted/_v3/LessonV3.tsx`](src/lessons/freddy-fractions/scripted/_v3/LessonV3.tsx) — accepts `progress` + `sessionId`; records pass/fail at MCQ + FractionInput beats; plays audio via `audioEngine` on stage change; mirrors speaking state to `tutorStore`.

**V3 voicing**
- [`src/lessons/freddy-fractions/tutor/dialogue.json`](src/lessons/freddy-fractions/tutor/dialogue.json) — 36 new `v3_<stage>` keys with TTS-friendly rewrites.
- 50 new MP3s under [`public/lessons/freddy-fractions/audio/`](public/lessons/freddy-fractions/audio/) (`v3_beat_*.mp3` + segments). Manifest updated.

**Sage character**
- [`public/lessons/asl/images/characters/sage/saluting-start.png`](public/lessons/asl/images/characters/sage/saluting-start.png) + `saluting-end.png` — copied from main repo into worktree.

**Brainlift content**
- [`Acutis-Institute/Acutis-Institute_Brainlift.md`](Acutis-Institute/Acutis-Institute_Brainlift.md) — synced tightened prose from main's working tree (title split, paragraphs condensed; -4 net lines).

**Carlo Acutis portrait**
- [`public/lessons/acutis/images/carlo-acutis.png`](public/lessons/acutis/images/carlo-acutis.png) — copied into worktree from `Acutis-Institute/Assets/`.

---

## Important User Prompts

> "I want in this, instead of saying a Superbuilders project, I want it to say a Jason Dijols project. I would like Jason Dijols to be a link that, when hovered, has an underline treatment, and that link links out to my LinkedIn."

**Why it mattered:** Established the interactive AboutCard pattern (link carve-out from a clickable card) that later got reused for the Superbuilders link on the BrainliftCard.

> "Let's make sure that all four cards have the same hover action and that when you click on any area inside of the card, it navigates you to the appropriate page... Also, the BrainLift and About pages should not require logging in or signing up. Only the lessons will require the sign-up flow."

**Why it mattered:** Locked the unified card interaction model and the auth gating policy (lessons gated, BrainLift + About public).

> "Yes, I think your recommendation to dial down the hatch to 0.04 or 0.03 is right."

**Why it mattered:** Cemented a feedback pattern that recurred throughout the session — terse confirm-or-tweak directives on visual values, expecting me to land specific numbers rather than ranges.

> "Can we remove the em dash? That's an AI giveaway. Redo the punctuation there."

**Why it mattered:** Established a writing convention enforced through the rest of the session (comma/period swaps for em-dashes in any text I authored).

> "Could we make all the animations three times as slow?"

**Why it mattered:** A single short directive that drove a multi-edit pass across the LandingPage entrance variants.

> "I think I'd lock the mastery rules that you recommended, which are different for sign language versus fractions, which I'm fine with... If any of those qualifications are reached for any specific letter attempt, word attempt, or sign attempt, then that would constitute mastery to me."

**Why it mattered:** Triggered the pushback that 2/3 + 3-consecutive + 5/6 collapses to 2/3, which led to the cleaner ASL rule (3-consecutive OR 5/6 only).

> "Let's go with the Sticky Mastery Simplest option. Start wiring this card and building the details for you."

**Why it mattered:** Locked the post-mastery behavior and authorized the dashboard build.

> "hybrid execute your recommendations and wire up record attempt"

**Why it mattered:** Single sentence that authorized the largest commit of the session (mastery rule engine + landing dashboards + Freddy V2↔V3 hybrid + recordAttempt wiring), with explicit trust to choose the path.

> "yea i want v3 voice. audit it, plan it, build it, wire it up, test it and get it done"

**Why it mattered:** Direct authorization for the V3 voicing end-to-end, including real ElevenLabs API spend.

> "make sure the acutis lesson markdown file content is updated. we made changes recently"

**Why it mattered:** Surfaced uncommitted Brainlift edits sitting in main's working tree that the feature branch hadn't picked up; pulled them in before ship.

> "merge push go to prod"

**Why it mattered:** Six words that compressed the entire ship sequence — merge from origin/main, push to both remotes, fast-forward main, trigger Vercel.

---

## Action Timeline

1. BrainliftCard redesign — Carlo Acutis portrait, linear gradient transition, title elevated to "Saint Carlo Acutis Institute".
2. Hairline rule eyebrows added across all four bento cards.
3. AboutCard reworked — "A Jason Dijols project" with LinkedIn link, then upgraded to fully clickable card → `/workflow`.
4. `/workflow` route + WorkflowPage skeleton created.
5. Auth gating: BrainLift + About bypass; ASL + Freddy keep sign-in gate.
6. Faint diagonal hatch added to AboutCard; lesson cards flipped to 135deg.
7. Lesson time estimates updated (Freddy ~10 min, ASL ~15 min).
8. Staggered entrance animations (framer-motion variants), later slowed 3×.
9. ASL card: hand glyph swapped for Sage character; "Learn / AMERICAN / SIGN LANGUAGE" title; bold Sage in subtitle.
10. Freddy character resized + repositioned across several iterations of feedback.
11. Card order experiments (3 arrangements) and revert to original.
12. SignInButton shipped, then re-styled to secondary ghost chrome.
13. MuteToggle + CvToggle: state via icon swap only; DESIGN.md updated.
14. Mastery rule engine (`mastery.ts`) + 24 tests + both clients refactored.
15. LessonDetailsView built with expand-in-place via `layoutId`.
16. Freddy V2→V3 hybrid wired (catalog + Mount session + Continue button + V3 attempt recording).
17. Hybrid CTA logic in LandingPage details view.
18. 36 V3 dialogue lines extracted into `tutor/dialogue.json`; LessonV3 audio effect wired.
19. `generate-voice` script ran against ElevenLabs — 50 new MP3s + manifest.
20. Acutis Brainlift prose tightening pulled from main's working tree.
21. Merged `origin/main` (3 commits: DarkPageHeader work) into branch; no conflicts.
22. Branch pushed; main fast-forwarded on both remotes; Vercel auto-deploy triggered.

---

## Open Threads / Next Steps

- **Hint voicing** — 5 `hintOnWrong` strings in V3 still text-only. Easy follow-up if desired.
- **Orphan period MP3** — `v3_beat_1_distribute_4_s2.mp3` is just a "." segment because the dialogue is `"...Theo, {{NAME}}. See if you can..."`. Fix by changing the period after `{{NAME}}` to an em-dash (well, a hyphen given the user's em-dash aversion) and regenerating.
- **Freddy item catalog is minimal** — only 5 V3 assessment items right now. If the curriculum gets more depth, the by-item grid in the details view will want richer per-item labels.
- **V2 has no recordable items** — by design (it's a sandbox), but the details view shows "0 mastered" for someone who's only played V2. Could surface time-on-task or session count as a separate metric for V2.
- **CV confidence score per attempt** — schema has `uncertain` as a fourth `AttemptResult`; if you want quality-of-sign tracking beyond pass/fail, that's where it lives.
- **`claude/mystifying-curran-883aa7` + `claude/pedantic-chebyshev-73fbbc`** — both merged into main, no worktree attached. Safe to delete locally if you want to tidy.
- **Vercel CLI** — `54.2.0` installed; latest is `54.4.1`. `npm i -g vercel@latest` when convenient.
