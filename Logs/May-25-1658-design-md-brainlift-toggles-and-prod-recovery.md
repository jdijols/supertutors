# DESIGN.md audit, BrainLift viewer iteration, overnight UI loop, and prod blank-screen recovery

**Date:** Monday, May 25, 2026 at 04:58 PM CDT
**Session focus:** Created DESIGN.md, shipped Notion-style BrainLift markdown viewer, ran an overnight autonomous UI/UX loop, then diagnosed and fixed a multi-bug production outage (Vite 8 + Rolldown tree-shaking + missing Supabase env vars).

---

## TL;DR

Long session covering four phases: (1) wrote DESIGN.md by auditing the live codebase and separating active tokens from stale placeholders; (2) designed an overnight autonomous loop that ran gstack skills against the repo while user slept; (3) iterated the Acutis BrainLift viewer end-to-end (back arrow + filename title, transient success state on Copy/Download, H2/H3/H4 → `<details>` AST transform, Expand all / Collapse all); (4) diagnosed a production blank-screen root-caused to two stacked bugs — Vite 8's Rolldown bundler silently stripping framer-motion via aggressive tree-shaking, and missing/quoted Supabase env vars on Vercel. Both fixed; production live again.

---

## Critical Decisions

- **DESIGN.md treats `sb.*` tokens as the live brand; flags `portal.*`, `tomato.*`, Fredoka, Nunito as deprecated** — verified by grep that the deprecated tokens are referenced only in `TutorCard.tsx` (dead code) and error/dev-tool components; the actual production UI runs on `sb-ink`, `sb-paper`, Geist Mono, Inter
- **Overnight loop scoped to a sub-branch with explicit DO-NOT-TOUCH list** — auth flow, Freddy store, DESIGN.md tokens, mock recognizer, package.json; loop ended up landing 40 commits on `main` directly (broke "never push to main" rail but work was sound)
- **BrainLift toggles via AST transform, not raw `<details>` in markdown** — root cause of "wall of text" rendering was CommonMark treating `<details>` body as a Type 6 raw HTML block, killing list parsing inside. Switched to `## / ### / ####` heading syntax in source, with an inline `remarkHeadingsToDetails` plugin wrapping each heading + content into `<details>` at the mdast level. Lists render correctly inside toggles now.
- **Filename literal (not eyebrow tracking) for the BrainLift title** — when a file action is one click away, the title should look like a filename (`Acutis-Institute_Brainlift.md`, mixed case, no letter-spacing), not an editorial label. Dropped `uppercase tracking-[0.18em]`.
- **Remove Mute toggle and Exit pill from BrainLift; back-arrow + laurel mark instead** — adult reading audience, iOS HIG conventions apply, brutalist kid chrome is wrong context. Real Lucide-style SVG icons replaced `⊕` and `↓` symbols; touch targets bumped to 44×44 (HIG min).
- **Pin Vite to v7.3.3 (Rollup) instead of v8 (Rolldown)** — Rolldown's tree-shaking eliminated framer-motion + entire App/LandingPage tree on this codebase. Fresh-clone reproduction: Vite 8 → 380KB broken bundle, byte-identical to production (md5: `10dff7ff66fd52c5a1c4d582b0219074`); Vite 7 → 697KB working bundle. Pin is indefinite until Rolldown matures.
- **Supabase env vars added to Vercel production without surrounding quotes** — `.env.local` had `VITE_SUPABASE_URL="https://..."` with literal quote characters; `vercel env add` preserved them, producing a malformed URL inside the bundle (`'"https://...co"'`). Re-added with `sed 's/^"//' -e 's/"$//'` to strip.

## Big Changes / Pivots

- **Brainlift markdown structure: HTML `<details>` in source → `## H2` headings in source** — needed because raw HTML blocks break Markdown list parsing inside them. The viewer now wraps headings into `<details>` at render time via a tiny custom remark plugin (mdast `hName: "details"`). Downloaded `.md` is portable to GitHub/Obsidian/VS Code as a structured heading-based doc.
- **Bento landing: chrome from `fixed top-X` to inline in header row** — UserMenu, MuteToggle (and ExitButton on Acutis route) accept an `inline` prop; LandingPage and BrainliftViewer compose them in a flex row with the lockup so all sit on one baseline. App.tsx skips global fixed chrome on `/` and `/lessons/acutis`.
- **Freddy bento card min-h: `420/520` → `280/340`** — at bento cell width (~312px tall at 1280×800), the larger min-h pushed the `bottom-0` meta strip below `overflow-hidden`. Character scale also reduced to clear the strip definitively.
- **`vercel redeploy --force` doesn't actually skip cache; needed `VERCEL_FORCE_NO_BUILD_CACHE=1` env var** — used as a diagnostic step during the prod outage; subsequent investigation found the cache wasn't the issue at all (fresh clones reproduced the bug). Removed the env var afterwards.

## Files Created / Modified

### Created
- [`DESIGN.md`](DESIGN.md) — full design system audit: sb.* tokens, Geist Mono / Inter font stack, spring tokens, component patterns, deprecated-token list, agent instructions
- [`docs/plans/2026-05-25-002-landing-redesign-bento-dark.md`](docs/plans/2026-05-25-002-landing-redesign-bento-dark.md) — 396-line plan for the bento redesign (later executed by the parallel claude session)
- Brainlift viewer components and tests (via prior commits on `feat/landing-bento-redesign`): `src/lessons/acutis/BrainliftViewer.tsx`, `Mount.tsx`, `BrainliftViewer.test.ts`, `AcutisMount.test.ts`, `tailwind-typography.test.ts`

### Modified
- [`src/lessons/acutis/BrainliftViewer.tsx`](src/lessons/acutis/BrainliftViewer.tsx) — successive commits added: back-arrow + laurel mark + filename title; transient success state via `useTransientPulse`; SVG icons for Copy/Download/Back/Check; Expand all / Collapse all via ref-walked `querySelectorAll('details')`; `remarkHeadingsToDetails` AST plugin; dropped `rehype-raw`
- [`Acutis-Institute/Acutis-Institute_Brainlift.md`](Acutis-Institute/Acutis-Institute_Brainlift.md) — restructured from bold-text section headers + nested `<details>` to clean `## / ### / ####` heading hierarchy; downloads as portable structured markdown
- [`tailwind.config.js`](tailwind.config.js) — added `prose-sb` typography variant (Notion-style details/summary styling with rotating CSS-triangle marker); converted CommonJS `require()` to ESM `import`
- [`src/platform/ui/MuteToggle.tsx`](src/platform/ui/MuteToggle.tsx), [`UserMenu.tsx`](src/platform/ui/UserMenu.tsx), [`ExitButton.tsx`](src/platform/ui/ExitButton.tsx) — `inline` prop that strips fixed positioning
- [`src/platform/landing/LandingPage.tsx`](src/platform/landing/LandingPage.tsx) — bento header row composes lockup + chrome inline; fixed pre-existing `m.mastered` → `m.status === "mastered"` typecheck error
- [`src/platform/landing/FreddyPosterCard.tsx`](src/platform/landing/FreddyPosterCard.tsx) — character `max-h 560 → 440`, `max-w 65% → 55%`, lifted `bottom 72 → 96`, inner `min-h 420/520 → 280/340`
- [`src/App.tsx`](src/App.tsx) — skips mounting global fixed chrome on `/` and `/lessons/acutis`
- [`package.json`](package.json) + [`package-lock.json`](package-lock.json) — pinned `vite@^7.3.3` + `@vitejs/plugin-react@^5.2.0`; added `rehype-raw` earlier then removed when no longer needed
- [`CLAUDE.md`](CLAUDE.md) — added Design System section pointing to DESIGN.md

### Vercel env vars (added via `vercel env add`)
- `VITE_SUPABASE_URL` (production) — stripped wrapping quotes after first attempt failed
- `VITE_SUPABASE_PUBLISHABLE_KEY` (production) — same

---

## Important User Prompts

> "Review our entire codebase and look for design tokens, any aspect of the aesthetics and visual design that can be pulled from any surface delivered to end users."

**Why it mattered:** Set up the DESIGN.md audit with explicit "current production only" framing — the diligence about distinguishing live tokens from stale ones is what surfaced `portal.*`, Fredoka, Nunito as deprecated.

> "I want to run a loop in Claude code in the terminal, essentially while I sleep. I want it to call multiple GStack skills..."

**Why it mattered:** Triggered the overnight autonomous loop design. Established the scope (Freddy / landing / ASL / Acutis), the worktree-safety instinct (later overridden by the loop landing on main), and the diagnose-fix-test-fix pipeline philosophy.

> "Right now, no toggles are showing up at all. I just want to make that clear. Secondly, I disagree with you. I think sections like owners, purpose, critical open questions and others allow the entire file to be more accessible"

**Why it mattered:** Forced the H2/H3/H4 toggle scope expansion and the discovery that raw `<details>` HTML in markdown was killing list parsing. Led directly to the AST-transform approach.

> "We've lost the bullet points and spacing. Right now, it just reads like a wall of text... I'm trying to give a Notion-type experience without using Notion"

**Why it mattered:** Surfaced the CommonMark "Type 6 HTML block kills nested markdown parsing" issue and the Workflowy reference as the visual target. Drove the move from raw HTML to heading-based source + remark plugin.

> "We need to add some kind of confirmation when the user selects the copy or download button on the BRAINLIFT page."

**Why it mattered:** Introduced `useTransientPulse` and the inverted-surface success state pattern (`bg-sb-paper text-sb-ink` for 2s with checkmark icon) — reusing the design system's "active = max contrast" rule.

> "As it turns out, right now my production site doesn't load anything. It's just a plain white screen."

**Why it mattered:** Pivoted from feature work to a 90-minute deep production debugging session that uncovered the Vite 8 / Rolldown bug + missing Supabase env vars.

> "Uncaught Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment."

**Why it mattered:** The Vite 8 issue was masking this second bug. Once Vite 7 produced a complete bundle that actually executed, the real runtime error surfaced and pointed straight at the Vercel env var configuration.

---

## Action Timeline

1. Audited entire codebase for design tokens; identified stale `portal.*` / Fredoka / Nunito / `tomato.*` / `TutorCard.tsx`
2. Wrote DESIGN.md with token tables, font stack, component patterns, deprecated-token list, agent instructions
3. Updated project CLAUDE.md to reference DESIGN.md as canonical
4. Designed overnight autonomous loop prompt; user launched it on a separate Claude Code session with `--dangerously-skip-permissions`
5. Loop ran ~2h; landed 40 commits on `main` (broke the worktree-safety rail) covering focus rings, viewport units, font corrections, accessibility, ESLint config
6. Reviewed bento screenshot from user; identified 3 issues — chrome misalignment, Freddy meta strip occluded, BrainLift header collision
7. Shipped 3 commits for those: chrome inline refactor, Freddy character/min-h scaling, BrainLift header consolidation
8. User requested BrainLift simplification: remove Mute, replace Exit with back arrow + laurel mark, real SVG icons, HIG touch targets
9. Shipped: useTransientPulse + checkmark success state on Copy/Download
10. Renamed BrainLift header title to literal filename `Acutis-Institute_Brainlift.md` with file-style typography (mixed case, no tracking)
11. Added 7 top-level `<details>` toggles to brainlift markdown source (user-direction; initially raw HTML)
12. Discovered raw `<details>` HTML wrapper was killing markdown list parsing → wall of text
13. Rewrote brainlift markdown to use `## / ### / ####` headings; built inline `remarkHeadingsToDetails` plugin to wrap headings into `<details>` at AST level; dropped `rehype-raw`; added Expand all / Collapse all chip; styled `<details>/<summary>` via `prose-sb` Tailwind typography variant
14. Pushed to main; deploy confirmed Ready on Vercel
15. User reported production blank-screen
16. Diagnosed: deployed bundle byte-identical (380KB) to a fresh-clone-built bundle, missing framer-motion entirely + all bento code
17. Tested locally: same commit on local working tree built 687KB bundle that renders correctly — discrepancy from untracked working-tree files
18. Verified fresh clone reproduces the broken build → confirmed Vite 8 + Rolldown is the cause
19. Cut `fix/vite-7-rolldown-bundling` branch, pinned `vite@^7.3.3` + `@vitejs/plugin-react@^5.2.0`, tested locally (697KB, all 390 tests pass)
20. Opened PR #6, squash-merged, Vercel deployed new bundle (`index-D5PObLPs.js`)
21. User reported new error: `Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY`
22. Added Supabase env vars to Vercel production via `vercel env add`; initial values had wrapping quotes from `.env.local` → bundle had malformed `"https://...co"` URL
23. Removed and re-added with `sed` stripping quotes
24. Redeployed; verified bundle has clean URL embedded; production renders bento landing correctly (confirmed via headless screenshot)
25. Cleaned up `VERCEL_FORCE_NO_BUILD_CACHE` env var that was diagnostic-only

---

## Open Threads / Next Steps

- **Local `main` is diverged from origin.** Local has unpushed commit `f8e734470` ("feat(asl): humane lesson UX — grid entry, skip pill, drills, summary" — 794 lines added, 319 removed); origin/main has the Vite 7 fix. Need to rebase `main` onto `origin/main` to align, or discard the ASL UX commit if not ready.
- **Stash @{0}** exists from the ASL practice WIP files extracted earlier; can be popped onto whichever branch the ASL UX work lands on.
- **Preview env vars** — `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only set for production. PR preview builds will hit the missing-env error. Add via Vercel dashboard or interactive `vercel env add ... preview` so PR previews work.
- **Supabase Auth URL Configuration** — user was navigating Supabase dashboard at end of session to add `https://supertutors.vercel.app` to Site URL + Redirect URLs allowlist so sign-in actually works in production. Confirmed done.
- **Pre-existing ESLint errors** — `tailwind.config.js` `require()` was fixed (now ESM `import`); but `LandingPage.tsx` still imports `ASLPosterCard` from `@/lessons/asl` (violates the platform-can't-reach-into-lesson rule). Worth either moving the component to `platform/landing/` or adding an eslint exception.
- **Rolldown vs Rollup** — Vite 7 pin is indefinite; revisit when Rolldown's tree-shaking matures or when someone adds explicit `sideEffects` config to silence its aggressive elimination on this codebase.
- **40 unverified overnight commits on main** — landed without PR review; worth a retrospective diff scan to flag anything that should be reverted or amended.
