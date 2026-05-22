# May 21, 2026 at 11:34 PM — Design system unification, iPad bug pass, and Freddy idle life

## TL;DR

Massive design-system + iPad polish chat. Standardized chrome tokens (sizing, motion, focus, active states) across MuteToggle / ExitButton / AddPizzaButton / ToolPicker / NameInputOverlay / SpeechBubble / Start Lesson pill, flipped sub-item hovers to "transparent at rest, white on hover" with a faint 1px ink/10 border, pulled the CV toggle out of the ToolPicker into a standalone bottom-left button with a FaceTime-style camera icon (plus dual on/off icon variants matching MuteToggle's filled-body weight), fixed a cluster of iPad/Safari bugs (viewport `100dvh`, drag-glow trail, image long-press copy, tracking-cursor color, ToolSprite touch-lift hide), inverted MuteToggle so "sound on = dark/active" (matches the system-wide convention), repositioned + repaired the counter occlusion using `dvh`/`dvw` so the plates stay aligned with Safari's status bar showing, and added a `useFreddyIdle` hook that swaps Freddy into a thinking pose for 10s every 20s of no character action. Net: ~14 commits, 207 unit tests still pass.

## Decisions

- **Math-based scaling for the counter overlay (no breakpoint)** — `h-[max(31.51dvw,47.27dvh)]` exactly matches the interior bg's `object-cover` scale at any aspect ratio. Single CSS expression handles iPad Mini → 1440 desktop → ultra-wide cleanly; the user's instinct was a width breakpoint, but the math is the closed-form solution.
- **Dual icon variants for both MuteToggle and CvToggle** — both buttons now follow the same convention as Apple's mute icon (plain speaker / speaker-with-X). Camera gets dual-stroke slash (wider sb-paper outer + narrower currentColor inner) so the diagonal reads cleanly across both the cream bg and the filled dark body.
- **"Active = dark" is the system-wide rule** — flipping MuteToggle so volume-on is the dark/inverted state, matching CvToggle, ToolPicker selected tool, etc. Previously mute was the outlier.
- **Sub-items inside containers carry only a faint 1px border** — `border-sb-ink/10` so each item still reads as an affordance at rest, while heavy `border-2 border-sb-ink` stays on top-level chrome (Mute, Exit, AddPizza, NameInput card). Hierarchy reads clearly: thick black borders = top-level chrome, faint borders = sub-items.
- **Pull CV out of the ToolPicker** — hand-tracking is a different concern from glove/cutter selection (input modality vs which tool is held), so it becomes its own standalone chrome button paired diagonally with MuteToggle. Tool picker collapses from 228px → 156px wide.
- **Freddy idle tracks HIS last action, not the user's** — clarified mid-chat: a kid quietly slicing in the sandbox doesn't reset Freddy's clock. Only `setFreddy` calls from anywhere count as "activity." Pose snapshot captured at trigger time so restore is exact.
- **`100dvh` + `overflow: hidden` on html/body/#root** — Safari status bar no longer eats the bottom of the lesson + no scroll allowed regardless. Counter scaling also switched to `dvh`/`dvw` so the interior bg and the counter overlay share the same dynamic-viewport math.
- **Drop-shadow glow disabled during drag** — `drop-shadow` filter on transformed elements leaves paint trails in Safari (desktop + iPad). Gated on `!isDragging` + added `willChange: transform`. Glow still works on hover at rest.
- **Image long-press / drag-to-save protection added globally** — `@layer base img { -webkit-touch-callout: none; -webkit-user-drag: none; ... }` in globals.css. Existing `draggable={false}` attrs stay as the React-side belt; this is the CSS suspenders.
- **Sub-item hover flips to "transparent at rest, white on hover"** — user wanted items to recede into the cream container until interacted with. Active state (bg-sb-ink + inverted icon filter) unchanged.

## Key Prompts & Responses

> **User:** "I'd also like to make a change to the finger tracking line and dots for the computer vision feature. Right now, they are not matching our design tokens... ink and paper color are a great combination here, because right now it is using this terracotta orange that does not match the rest of our aesthetic."
>
> **Outcome:** `CURSOR_COLOR_IDLE` → `#EFE7DA` (sb-paper), `CURSOR_COLOR_PINCH` → `#1A1A1A` (sb-ink). Hand-tracking visualization is now first-class chrome, not debug viz.

> **User:** "We need to invert the colors for the mute button... we have this theme that black means it's active. For example, when the computer vision is active, the icon is black."
>
> **Outcome:** Flipped MuteToggle's `muted ? bg-ink : bg-paper` conditional. "Volume on" is now the dark/active state, matching the CvToggle / ToolPicker convention. Icon swap (X vs sound waves) stays the same — only the bg/text color tier flips.

> **User:** "On your take on the implementation, you said it tracks the last interaction, but it should actually track the last movement or action by Freddy."
>
> **Outcome:** Rewrote the idle hook spec mid-conversation. The watcher subscribes to the `freddy` store slice; any `setFreddy` from outside the hook resets the timer. Kid silently dragging pizzas around no longer counts as "Freddy activity." `skipNextWatchRef` guards against our own writes triggering the watcher.

> **User:** "I think this has to do with how we're compensating for the status bars. On Safari's iPad, that could be affecting the pixels there, so maybe we just need to offset the counter's position to account for the height of the status bar."
>
> **Outcome:** Counter formula switched from `vh`/`vw` to `dvh`/`dvw`. The interior bg + main are sized against `dvh` (status-bar-aware viewport); the counter was still using `vh` (full chrome-retracted height), which is larger when iPad Safari's bar is visible. That extra few pixels were the misaligned plates.

> **User:** "Is the new camera icon the correct color scheme and design aesthetic that matches the other icon buttons, like the mute button? It looks like it's currently white when the other icons are paper."
>
> **Outcome:** Refactored CameraOnIcon / CameraOffIcon to use `fill="currentColor"` on the rect body + lens path (was stroke-only outline). Matches MuteToggle's filled-speaker visual weight. Off-state slash gets the dual-stroke "cut-through" treatment so it reads on both bg colors.

> **User:** "When viewing on the iPad, when there's no current touch down of the user's finger on the screen, the custom cursor disappears."
>
> **Outcome:** Added `touchDown` flag inside ToolSprite's effect. On `pointerup` if `e.pointerType === 'touch'` or `'pen'`, hide the sprite (opacity 0). Mouse/trackpad retain always-visible behavior. Visibility rule: `(over text input) OR (touchish && !touchDown) → hide`.

> **User:** "I'd also like to make a change to the finger tracking line and dots for the computer vision feature... ink and paper color are a great combination here."
>
> **Outcome:** (See above for the constants change. The companion change was the active state of the cursor itself — pinch = ink, idle = paper — so the visualization mirrors the system's `active = dark` rule.)

## Files Touched

### New files
- [src/lib/useFreddyIdle.ts](src/lib/useFreddyIdle.ts) — 1Hz idle-loop hook; 20s no-`setFreddy` → thinking pose for 10s → restore. Skip-own-write guard, external-write invalidation, enabled-flag gating.
- [src/modules/world/CvToggle.tsx](src/modules/world/CvToggle.tsx) — Standalone bottom-left chrome button mirroring MuteToggle. Two icon variants (`CameraOnIcon`, `CameraOffIcon` with dual-stroke slash). Owns URL `?cv=true` sync.

### Modified — core lesson
- [src/modules/lesson/LessonView.tsx](src/modules/lesson/LessonView.tsx) — `h-screen` → `h-[100dvh]`; Freddy container nudged twice (`-28` → `-12` → `12`); modal text scale alignment; `select-none [-webkit-touch-callout:none]` on main.
- [src/modules/lesson/LessonExploration.tsx](src/modules/lesson/LessonExploration.tsx) — Mounted `useFreddyIdle` gated on stage ∈ `{free_play, cued, done}`. Start Lesson pill converted to `motion.button` with shared motion tokens.
- [src/modules/lesson/LessonTable.tsx](src/modules/lesson/LessonTable.tsx) — CV permission modal: em dash removed, body text → `text-base`, buttons → `text-base` + focus-visible pattern, emoji → `text-3xl`, `data-cursor-pointing` on dialog. Cursor colors `#EFE7DA`/`#1A1A1A`. CV button removed (moved to standalone). Webcam preview repositioned to bottom-left above CvToggle (8px gap).

### Modified — chrome / world
- [src/modules/ui/MuteToggle.tsx](src/modules/ui/MuteToggle.tsx) — Inverted: `muted ? sb-paper : sb-ink` (was the opposite). Doc comment updated.
- [src/modules/world/ToolPicker.tsx](src/modules/world/ToolPicker.tsx) — CV button + helper removed. Sub-items get `border-sb-ink/10` + `hover:bg-sb-card`. Active state adds `[&_img]:brightness-0 [&_img]:invert` so the dark active tool inverts the icon to a white silhouette.
- [src/modules/world/AddPizzaButton.tsx](src/modules/world/AddPizzaButton.tsx) — `transition-all` → `transition-colors`, disabled state unified to `opacity-40`. Pizza picker items: `bg-mozzarella-50` → transparent + faint border + `hover:bg-sb-card`. Motion tokens aligned to chrome standard.
- [src/modules/world/NameInputOverlay.tsx](src/modules/world/NameInputOverlay.tsx) — Caption + placeholder switched to `sb-muted` (WCAG AA). Send button: `shadow-lg shadow-sb-ink/30` → `shadow-xl shadow-sb-accent-deep/25`, added `whileHover:1.04`, `hover:bg-sb-ink/90`, focus-visible. Pulse prop added.
- [src/modules/world/SpeechBubble.tsx](src/modules/world/SpeechBubble.tsx) — Speaker label `sb-accent-deep` → `sb-ink/70` (passes WCAG AA at ~6:1).
- [src/modules/world/ToolSprite.tsx](src/modules/world/ToolSprite.tsx) — `touchDown` flag + pointerType-aware show/hide. Hide on touch lift (`pointerup` from `touch`/`pen`); always visible for mouse.
- [src/modules/world/RestaurantScene.tsx](src/modules/world/RestaurantScene.tsx) — Counter overlay sized via `h-[max(31.51dvw,47.27dvh)]` w-auto, left-1/2 -translate-x-1/2.
- [src/modules/world/index.ts](src/modules/world/index.ts) — Added `CvToggle` export.

### Modified — supporting
- [src/modules/table/PizzaPiece.tsx](src/modules/table/PizzaPiece.tsx) — Added `isDragging` state; drop-shadow filter gated on `!isDragging`; `willChange: transform` on visual layer to fix Safari paint trails.
- [src/styles/globals.css](src/styles/globals.css) — `overflow: hidden` on html/body/#root; `@layer base img { -webkit-touch-callout: none; -webkit-user-drag: none; user-select: none; }`; cursor-text/cursor-pointing exemptions kept.
- [src/App.tsx](src/App.tsx) — `min-h-screen` → `min-h-[100dvh]`.

## Open Threads

- **Freddy idle hook only verified via 207-test suite + typecheck** — the headless preview pauses animations + audio in hidden tabs, so the 20s/10s loop wasn't observed firing visually. Logic is straightforward setInterval + state, but eyeball it in a real browser after the next Vercel deploy to confirm the thinking pose actually triggers and restores cleanly.
- **CV mode itself can't reach `noticeAccepted` in headless** — every CV-related visual verification this session used a placeholder div or relied on inspect calls. The modal copy, dual-stroke slash icon, webcam-above-toggle gap, and finger-tracking color swap all need a real iPad / desktop browser pass.
- **Some Safari pointer behavior is best-effort** — `e.pointerType === "touch"` / `"pen"` works in modern Safari but the touch-lift hide hasn't been verified on an actual iPad. Per-device sanity check before the next demo.
- **Counter `dvh` fix benefits only iPad Safari with status bar visible** — on desktop / preview, `dvh === vh` so the numbers don't change locally. The plates-alignment fix only takes effect in environments where the browser actually retracts chrome.
- **MuteToggle inversion is a semantic change kids may need to re-learn** — anyone who'd already developed muscle memory ("dark = muted") now has to update. Worth confirming the new convention with a user-test before broader release; it's correct system-wide but is a behavioral break.
- **Vercel deploy timing is implicit** — every commit went `git push origin main` and Vercel handles the deploy. There's no in-band confirmation in the session that the latest commit (`44af6f8`) has actually finished building. Check the dashboard before the next demo.

## Next Steps

1. **Eyeball the Freddy idle loop in a real browser** — load the deployed `/lesson?skip=true&name=Test`, slice a pizza so you're in `free_play`, leave the tab focused but don't interact with anything. Confirm: at ~20s Freddy swaps to facing-student + gesture=thinking; at ~30s he returns to facing=guest + gesture=ok. Trigger a slice mid-think to confirm the external-write invalidation kicks in cleanly.
2. **iPad device pass for all the Safari fixes** — `100dvh` (no scroll, no chrome cut-off), counter plates alignment with status bar visible, pizza drag (no glow trail), long-press on background PNGs (no save/copy callout), ToolSprite hide on finger lift. File path: spin up the deployed URL on a real iPad Air or Pro in landscape Safari.
3. **CV permission modal real-browser check** — toggle the CV button (bottom-left), accept the privacy modal, confirm: no em dash, body text at `text-base` density, pointing-glove cursor over the modal, finger-tracking dots/lines in `sb-paper`/`sb-ink` (not terracotta), webcam preview parked 8px above the CV toggle.
4. **Camera icon weight sanity** — confirm filled body + dual-stroke slash reads well across all three tool/chrome corners. If the slash looks fuzzy at the rendered size, consider bumping outer stroke from `4` to `5`.
5. **Consider extracting design tokens to a shared utility** — every chrome button now duplicates the same className soup (`fixed ... w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-sb-ink shadow-xl shadow-sb-accent-deep/25 ...`). If we add a 4th chrome button or revisit the spec, factor into `<ChromeButton>` component or a `chromeButton` className constant.
6. **Add an e2e or unit test for the idle hook** — current test suite proves it doesn't break existing flows but doesn't actually drive the 20s → 10s loop. Vitest with `vi.useFakeTimers()` would let us assert the pose swap + restore deterministically.
7. **Investigate the `--no-edit` git-rebase comment from earlier system reminders** — irrelevant to current work but flagged as a behavior to remember if rebasing future history.
8. **MuteToggle inversion + WCAG retest of speaker icon contrast** — the new active (dark bg + white icon) state was visually verified, but the WCAG contrast ratio for white-on-#1A1A1A should be confirmed (~14:1 expected, which is AAA).
