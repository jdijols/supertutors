# May 22, 2026 at 12:05 PM — Final lesson fixes and submission prep

Morning-of-submission session. Cleanup pass on what the autonomous overnight loop shipped, plus the README/demo-video deliverables for the noon hiring-partner submission.

---

## TL;DR

Closed out the SuperTutors project for the noon deadline. The autonomous overnight loop (logged in [May-22-0125-scripted-lesson-shipped.md](Journals/May-22-0125-scripted-lesson-shipped.md)) shipped the Share-the-Pizza scripted lesson but left two material issues: a corrupted `lesson_intro_s0.mp3` (155 KB of non-English gibberish from an ElevenLabs misgeneration) and an even worse semantic bug where the new `lesson_*` dialogue lines were generated but the `KEY_BY_STAGE` map in [LessonScripted.tsx](src/modules/lesson/LessonScripted.tsx) still pointed at the old sandbox `aha_*` keys — so the kid heard a 2-second "Quarters! Four equal pieces." instead of the bridge line, no name in the reveal, and the wrong closing line. This session: fixed the README requirements, authored a surgical overnight prompt that ran successfully, then this morning swapped the em-dash in `lesson_intro` to a comma (broke the misgeneration), regenerated 28 MP3s after the user topped up ElevenLabs credits, rewired all 9 stage→dialogue mappings to the real `lesson_*` keys, and added a "Lesson complete!" card with a Play again button so the kid isn't stranded after the closing line. Three commits on `main` (`d2ceee3`, `7518683`, plus everything from the overnight loop), both remotes (GitHub + GitLab) at `7518683`, working tree clean. Demo video still needs to be recorded.

---

## Decisions

- **README requirements satisfied via 4 surgical additions** — deliverables table at the top, demo-video Loom placeholder, "Lesson Flow" section describing the 4-act arc, updated status line at the bottom. Avoided lying about a lesson that didn't exist yet by writing the section as the intended end state with the overnight loop committed to making it real.
- **Overnight prompt was self-contained and aggressive** — surgical recon list (sample 8 specific screenshots instead of all 38), hard stop at 07:00 AM PT, explicit safety rails (don't touch the `aha:` sub-machine, preserve all existing e2e tests, never `git add .`), and explicit commit/push cadence (one logical chunk per commit, push every time so Vercel auto-deploys are the real verification surface).
- **Push to `main` during overnight loop** — same pattern as the 2026-05-21 CV loop. Vercel auto-deploys each commit, preview URLs available, broken state self-recovers within minutes.
- **Em dash → comma in `lesson_intro` to break ElevenLabs misgeneration** — `lesson_intro_s0.mp3` was 155 KB (vs 26 KB for the next-sized segment); ElevenLabs was generating non-English audio from "Alright kid — two hungry friends just ordered." The em-dash was the suspected trigger (most other dialogue lines also use em dashes and worked fine, but this one consistently failed). Changing to a comma both invalidated the manifest hash (forcing regeneration) AND broke whatever deterministic bug ElevenLabs had with this specific phrase. Resulting file was 34 KB — exactly in the normal range. Matches the natural reading of the line.
- **Restored the broken MP3s from git mid-session, before the user topped up credits** — when `npm run generate-voice` failed on quota, I'd already deleted the broken files. Restoring them kept the lesson playable (gibberish > silence) so the user wasn't blocked on testing while waiting to add credits.
- **After top-up: 28 MP3s generated in one pass** — 1 regenerated (`lesson_intro_s0`) + 27 brand-new that the overnight loop ran out of credits before completing (`lesson_react_quarters_*`, `lesson_compare_prompt_*`, `lesson_not_equal_*`, `lesson_stuck_*`, `lesson_wrong_eighths_*`, `lesson_reveal_*`, `lesson_end_*`, `lesson_react_halves_s3/s4`). Manifest auto-pruned to match.
- **Quick wire-up over medium extension (time pressure)** — user picked the 15-min fix over a 45-60 min eighths-beat extension. Lesson stays a tight 4-beat arc but uses all the new authored lines, gets name-personalization in the reveal, and has a clear closing state. Faithful to the original overnight authoring effort rather than a half-baked Synthesis-fidelity expansion.
- **`win` stage → `lesson_end` instead of `lesson_win`** — `lesson_win` says "you put it back together — just like a real pizza chef" which is the SANDBOX win semantic (reassembling pieces back into a whole pizza). That doesn't fit the equivalence-discovery arc. `lesson_end` says "you just proved that one-half equals two-quarters — that's real math" — explicit articulation of what the kid learned. Better closer.
- **"Lesson complete!" card with Play again button** — pure UX patch for the stranded-after-win state. Card uses the same chrome aesthetic as the "Start lesson (beta) →" pill. Play again navigates to `/lesson?lesson=scripted&name=<existing>` so the kid gets a fresh state machine without losing their name.
- **"Start lesson (beta) →"** — explicit signal to the user (and to the hiring partner watching the demo) that the scripted arc is work-in-progress, not the final form. Minor copy edit, big honesty win.
- **Skipped browser preview verification for the button text edit** — per the user's `feedback_lightweight_ui_changes` memory: "Skip task tracking and heavy verification for small UI/UX tweaks; edit and ship." Spun up the preview only for the substantive state-machine change at the end.

---

## Key Prompts & Responses

> **User:** "We never implemented the lesson flow, and I'm not going to do it. I really want you to execute this for me… I want us to basically have a prompt that I'm going to give Claude in the terminal that will allow us to run a loop so that it's constantly iterating, running tests, and building out the lesson."
>
> **Outcome:** Wrote the overnight prompt as a ~250-line markdown document with explicit mission, recon strategy (sample screenshots, don't slurp), implementation phases, safety rails, verification checklist, and a hard stop time. The loop ran from ~22:00 → 01:30 with 5 commits landing.

> **User:** "Some confidence that you got this would be greatly appreciated. If you can write the readme file and then return the right prompt to start our loop, then that would be the most effective."
>
> **Outcome:** Made minimal README edits (4 surgical additions), shipped them uncommitted for the user to review, then handed off the prompt as a copy/paste block.

> **User:** "The ElevenLabs voice that says the line 'All right, kids too hungry, kids need to split a pizza evenly.' That line needs to be redone because some bug happened where he doesn't speak English."
>
> **Outcome:** Initially tried to delete + regenerate via `npm run generate-voice`. Hit a `quota_exceeded` 401 from ElevenLabs (0 credits). Restored the broken files from git to keep the lesson playable, reported the blocker. User topped up credits.

> **User:** "Okay, I added $50 worth of credits. Go ahead and regenerate any broken voices or ones that we were not able to complete last night."
>
> **Outcome:** Discovered via file-size scan that `lesson_intro_s0.mp3` was a 155 KB outlier (6× the next-largest segment) AND that 8 other authored `lesson_*` lines had NO audio at all — the overnight loop had run out of credits partway through generation. Changed the em-dash in `lesson_intro` to a comma (invalidates manifest hash + breaks the misgeneration), ran generate-voice once, and 28 files landed cleanly. `lesson_intro_s0` came out at 34 KB — exactly normal.

> **User:** "What is supposed to happen after he says, 'You put it back together like a real pizza chef'? I went through basically just three steps… The rest of the lesson doesn't continue in any way that I can tell."
>
> **Outcome:** Read [LessonScripted.tsx](src/modules/lesson/LessonScripted.tsx) and found the `KEY_BY_STAGE` map was wiring 9 stages to old `aha_*` sandbox keys instead of the new `lesson_*` lines the overnight loop had authored and we'd just regenerated. The new lines were dead code. Also no closing UI after `stage === "done"`. Surfaced the diagnosis to the user with a 3-option decision matrix (quick wire-up / medium eighths extension / hold to diagnose). User picked quick wire-up.

> **User:** "Has everything been pushed to GitLab and GitHub, and there are no additional uncommitted changes in our local repo?"
>
> **Outcome:** Verified `working tree clean`, local at `7518683`, both remotes (`origin` is dual-configured with GitHub fetch + GitHub/GitLab push URLs) at `7518683`.

---

## Files Touched

### Source code
- [src/modules/lesson/LessonScripted.tsx](src/modules/lesson/LessonScripted.tsx) — Rewired `KEY_BY_STAGE` from old `aha_*` keys to new `lesson_*` keys (stuck_halves, wrong_eighths_h/q, stuck_quarters, react_quarters, compare_prompt, not_equal, stuck_compare, reveal, win→lesson_end). Updated `preloadDialogue` warm-up list. Added `motion.div` "Lesson complete!" card with "Play again →" button rendered when `stage === "done"`.
- [src/modules/lesson/LessonExploration.tsx](src/modules/lesson/LessonExploration.tsx) — Start Lesson pill text: "Start lesson →" → "Start lesson (beta) →".
- [src/modules/tutor/dialogue.json](src/modules/tutor/dialogue.json) — `lesson_intro`: em dash → comma. ("Alright kid — two hungry friends…" → "Alright kid, two hungry friends…")

### Docs
- [README.md](README.md) — Added submission deliverables table (4 rows: working prototype, web-based, demo video, README). Added demo video placeholder (Loom TBD link). Added "Lesson Flow" section (4-act narrative). Updated status line at the bottom to reference both autonomous loops. Note: User also made independent README edits during the session adding a `/lesson?lesson=scripted` row to the demo table — intentional, preserved.

### Audio assets
- [public/audio/lesson_intro_s0.mp3](public/audio/lesson_intro_s0.mp3) — Regenerated: 155 KB → 34 KB.
- 27 new MP3s under `public/audio/lesson_*` — `compare_prompt_s0/s1`, `end_s0-s3`, `not_equal_s0/s1`, `react_halves_s3/s4`, `react_quarters_s0-s2`, `reveal_s0-s5`, `stuck_compare_s0/s1`, `stuck_halves_s0/s1`, `stuck_quarters_s0/s1`, `wrong_eighths_s0/s1`.
- [public/audio/.manifest.json](public/audio/.manifest.json) — Manifest entries added/updated for all generated segments.

### Created this session
- [Journals/May-22-1205-final-lesson-fixes-and-submission-prep.md](Journals/May-22-1205-final-lesson-fixes-and-submission-prep.md) — This file.

### Touched by overnight loop (logged in detail in [the 01:25 journal](Journals/May-22-0125-scripted-lesson-shipped.md))
- `src/modules/lesson/LessonScripted.tsx` (created), `src/modules/lesson/LessonView.tsx`, `src/modules/lesson/LessonTable.tsx`, `src/modules/tutor/dialogue.json`, `e2e/lesson-scripted.spec.ts` (created), `deliverables/demo-video-script.md`, `README.md`. Plus follow-up `b795303` fixing the AHA-lock reset on `wait_compare` entry (pieces dragged into proximity before the stage was ready were locking out the AHA permanently).

---

## Open Threads

- **`lesson_reveal_s5.mp3` is a 4 KB orphan "!" segment** — The `splitDialogueLine` logic isolated a stray "!" character after `{{NAME}}` in the `lesson_reveal` text. Plays as a brief blip mid-line. Not a regression (existed since the overnight loop authored the file), low priority, but worth a 1-line fix in `dialogueSplit.ts` someday so single-punctuation tails get merged into the prior segment.
- **Interactive lesson flow was not fully verified end-to-end in this session** — I couldn't programmatically perform the slice+drag actions in the headless preview (canvas pointer events are non-trivial). I verified: page loads cleanly, `lesson_intro` bubble renders the right text, no console errors, typecheck clean. The user needs to manually walk through `/lesson?lesson=scripted&name=Jason` on the live Vercel deploy before recording the demo.
- **Lesson is still a tight 4-beat arc, not the full Synthesis depth** — User explicitly noted the Synthesis "Share the Cookies" reference is longer than what we shipped. They picked the 15-min quick fix over a 45-60 min eighths extension given the noon deadline. Captured as a real "we know it's lighter" rather than aspiring to parity.
- **Demo video not recorded** — README has a Loom placeholder URL (`https://www.loom.com/share/TODO`). User plans to record between now and noon submission and update the README.
- **ElevenLabs key now has ~$50 of credits** — the local `.env.local` key got the top-up. If we run the voice generator again it'll burn from this pool. Generating all 28 lesson MP3s this morning used ~12 credits per segment × 28 = ~336 credits, well within budget.
- **`labs.gauntletai.com` GitLab remote is dual-pushed via `origin`** — `git remote -v` shows `origin` has one fetch URL (GitHub) and two push URLs (GitHub + GitLab). Every push hits both. Verified at commit `7518683`.

---

## Next Steps

1. **Manually walk through the full scripted lesson on live Vercel** — open `https://supertutors.vercel.app/lesson?lesson=scripted&name=Jason` in a real browser with audio unmuted. Verify all 4 new `lesson_*` lines play (intro → react_halves → react_quarters → compare_prompt → reveal-with-name → end). Confirm AHA animation fires after dragging two quarters next to a half. Confirm "Lesson complete! 1/2 = 2/4 🍕" card appears with "Play again →" button. Acceptance: full arc plays without intervention, all audio is English and in Freddy's voice, no stranding at the end.
2. **Record the 1–2 min demo video** — use [deliverables/demo-video-script.md](deliverables/demo-video-script.md) as the loose script. Target arc: onboarding → name capture → exploration tour → Start lesson (beta) → halves → quarters → AHA → reveal → Win → Lesson complete card. Optional B-roll: CV physical mode (`/lesson?skip=true&cv=true`). Acceptance: video shows the conversational flow AND the interactive fraction manipulative as required by the brief.
3. **Update README demo-video placeholder** — replace `https://www.loom.com/share/TODO` in [README.md](README.md:7) with the real Loom URL. Same edit needed in the deliverables table row.
4. **Submit to hiring partner** — before noon 2026-05-22. Deliverables: live URL (`supertutors.vercel.app`), demo video link, GitHub repo link, this README.
5. **(Optional, post-submission) Fix the `lesson_reveal_s5.mp3` orphan-punctuation splitter quirk** — update `splitDialogueLine` in [src/lib/dialogueSplit.ts](src/lib/dialogueSplit.ts) to merge segments consisting solely of trailing punctuation into the prior segment. Add a unit test. Regenerate `lesson_reveal_*` MP3s. Acceptance: no segment file under ~8 KB unless the source text is genuinely that short.
6. **(Optional, post-submission) Extend the lesson to full Synthesis depth** — add an eighths beat (8 hungry friends → cut quarters into eighths → 4/8 = 1/2 = 2/4 multi-equivalence), a check-for-understanding question, and a brief recap before the Win. Author 6–8 new lines, regenerate audio, wire into [LessonScripted.tsx](src/modules/lesson/LessonScripted.tsx). Acceptance: lesson runtime grows from ~90s to ~3 min and matches the multi-beat structure of the Synthesis reference.
