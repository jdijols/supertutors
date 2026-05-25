# Landing Page Redesign — About Modal + Embla Lesson Carousel

**Date:** Monday, May 25, 2026 at 12:07 AM CDT
**Session focus:** Replace the bento landing layout with a modal-based About + 3-card lesson carousel; iterate scroll behavior until simplifying to Embla.

---

## TL;DR

Refactored the SuperTutors landing page: extracted the About card into a full-screen modal opened by a new info icon, replaced the Freddy bento card with a 3-lesson horizontal carousel (Acutis → ASL → Freddy), then — after a long custom-carousel iteration loop hit edge cases with wheel-scroll inertia and click/drag discrimination — replaced the hand-rolled carousel with **Embla Carousel + WheelGestures plugin** and made the carousel viewport full screen width so cards slide in from the actual screen edge instead of being clipped by page padding.

---

## Critical Decisions

- **About card → full-screen overlay modal** — Hidden behind a new info button so the landing surface stays focused on lesson posters.
- **InfoToggle mirrors MuteToggle chrome** — User specified "same icon button design as Freddy Fractions," same fixed-position slot as ExitButton (which is hidden on landing, so the two never collide).
- **Carousel order locked: Acutis → ASL → Freddy** — Hero (Freddy) demoted to slide 3; the two "Coming Soon" stub lessons take the first two slots.
- **Two new posters share one component (`ComingSoonPosterCard`) with theme prop** — Cream/laurel for Acutis, sky-blue/hand for ASL; both carry a diagonal "Coming Soon" corner ribbon. Freddy poster extracted unchanged from `LandingPage`.
- **CSS transitions over framer-motion for modal + custom carousel motion** — Headless preview tab has `visibilityState: hidden`, which pauses `requestAnimationFrame` and stalls framer-motion animations mid-flight. CSS transitions still progressed; framer-motion stayed for the icon-button hover/tap micro-animations only.
- **Final pivot to Embla Carousel** — After multiple wheel-handler iterations still produced "slow scroll skips two cards" and "scroll blocked on second card" bugs, replaced ~250 lines of custom carousel code with `embla-carousel-react` + `embla-carousel-wheel-gestures`. Embla handles drag, wheel, inertia detection, click-vs-drag discrimination, snap physics, and accessibility natively.
- **Carousel viewport is now full screen width** — Banner stays inside the `max-w-[1280px]` padded container; the carousel breaks out to `100vw`. Each slide is `flex: 0 0 100%`, with inner card content re-applying `mx-auto max-w-[1280px] px-...` so the active card visually aligns with the banner while neighboring slides slide in from the literal screen edge.
- **Arrow buttons removed; navigation = dots + drag + wheel + keyboard** — Originally had floating chevron buttons on the sides; user later said dots + scroll is sufficient.
- **Cards are full width, no peek** — Earlier iteration had ~88% width with the next card peeking from the right; user reverted to full-width.

## Big Changes / Pivots

- **Custom carousel → Embla Carousel.** Spent significant time tuning a hand-rolled wheel handler (`THRESHOLD` / `REST_MS` / `MIN_LOCK_MS` / direction-reversal logic / lock-on-rest). It still misbehaved on slow scrolls and after the first nav. User called it out as buggy and asked for a standard library; replaced the entire carousel implementation.
- **Cards with peek → full-width cards.** First implementation had each card at 88% width with the next card peeking ~12% from the right. User reverted to full-width with no peek.
- **Arrows → no arrows.** Floating chevron buttons removed mid-session at user request.
- **Modal/carousel animations: framer-motion → CSS transitions.** Headless preview tab pauses rAF; framer-motion modal animation stuck at opacity 0. Swapped to plain Tailwind transitions, which keep working when the document is hidden.
- **Carousel layout: padded container → full screen viewport.** The viewport was originally inside the page's `mx-auto max-w-[1280px] px-...` container, which clipped slides from sliding in from the screen edge. Restructured `LandingPage` so the carousel sits outside that container and individual slides handle the alignment themselves.

## Files Created / Modified

- [src/platform/ui/InfoToggle.tsx](src/platform/ui/InfoToggle.tsx) — New. Info icon button matching `MuteToggle` chrome; active/inactive state toggles the About modal.
- [src/platform/landing/AboutModal.tsx](src/platform/landing/AboutModal.tsx) — New. Full-screen overlay holding the old About card content. CSS-transition based enter/exit.
- [src/platform/landing/LessonCarousel.tsx](src/platform/landing/LessonCarousel.tsx) — New, then **fully rewritten** at end of session. Final version is a thin Embla wrapper with dot indicators + `WheelGesturesPlugin`.
- [src/platform/landing/FreddyPosterCard.tsx](src/platform/landing/FreddyPosterCard.tsx) — New. Extracted from `LandingPage` so the carousel can render all three posters as siblings.
- [src/platform/landing/ComingSoonPosterCard.tsx](src/platform/landing/ComingSoonPosterCard.tsx) — New. Generic poster used for Acutis and ASL with theme prop (`acutisTheme`, `aslTheme`), Coming Soon diagonal ribbon, and inline `LaurelGlyph` / `SignHandGlyph` SVG glyphs.
- [src/platform/landing/LandingPage.tsx](src/platform/landing/LandingPage.tsx) — Rewritten. Bento grid removed; renders the banner inside the padded container and the carousel as a full-width sibling. Owns the modal open state.
- [src/platform/landing/SuperTutorsLockup.tsx](src/platform/landing/SuperTutorsLockup.tsx) — Tightened the `lg` mobile sizes so the wordmark clears the new top-right chrome buttons.
- [package.json](package.json), [package-lock.json](package-lock.json) — Added `embla-carousel-react` and `embla-carousel-wheel-gestures`.

---

## Important User Prompts

> "Move the About card as a pop-up modal. This modal will open when we add an i icon (for information) at the top, near the SuperTutors name… Make the 'Learn Fractions' card one of a carousel of three… This carousel will have the ability to see the next card peek from the right side."

**Why it mattered:** The full initial spec. Established the four deliverables (modal, info button, carousel, peek) and the carousel ordering.

> "Let's actually have that I button as a second button to the left of the mute toggle button. It will have the same design aesthetic that our other icon buttons have within the Freddy Fractions lesson."

**Why it mattered:** Locked the chrome treatment for the info button — same `MuteToggle` styling, same fixed-position slot, same active/inactive treatment as `aboutOpen` state. Drove the decision to render it next to `MuteToggle` in App chrome (then scoped to landing-only).

> "Let's remove the arrow buttons on the left and right, and only have the indicator below. Also, allow the cards per lesson to be the full width, equal to the Super Builders card above it, instead of the peek capability that I asked for earlier."

**Why it mattered:** Mid-session pivot from the original "peek" design. Removed arrow chrome and bumped `CARD_RATIO` to 1.

> "I also want the carousel to be scroll enabled so that if I'm scrolling from top to bottom or from left to right, the cards advance from one to two to three."

**Why it mattered:** Added the wheel-scroll navigation requirement that triggered the long iteration loop on inertia detection.

> "A slow scroll moves two cards, where that should only be one card… I think there's probably a momentum attribute that needs to be adjusted down quite a bit."

**Why it mattered:** Forced a deeper rework of the wheel handler (added `MIN_LOCK_MS` hard floor on top of the rest-timer approach). Still didn't fully fix it, which led to the next prompt.

> "Right now, the experience of this is super buggy… If it's too complicated to execute, then let's simplify this. We should just use best practices and not any customization where possible… Another aspect that's broken is that the app's landing page padding clips the cards from sliding in from the edge of the screen."

**Why it mattered:** The decisive pivot. Killed the custom carousel, brought in Embla, and surfaced the padding-clip issue that triggered the full-width viewport restructure.

---

## Action Timeline

1. Explored the existing bento landing (`LandingPage.tsx`, `FreddyPosterCard` inlined, `MuteToggle`, `ExitButton`, lesson registry).
2. Read back the spec, asked clarifying questions on poster treatment, nav UX, and button placement.
3. Built `InfoToggle` mirroring `MuteToggle` chrome.
4. Built `AboutModal` (initially with `AnimatePresence` + framer-motion, refactored to CSS transitions after headless preview revealed framer animations stalling at `opacity: 0`).
5. Extracted `FreddyPosterCard` from `LandingPage`; created `ComingSoonPosterCard` with theme prop + inline `LaurelGlyph` / `SignHandGlyph`.
6. Built first version of `LessonCarousel` (custom framer-motion drag + animate, peek of next card, four nav modes).
7. Replaced framer-motion strip motion with native pointer events + CSS transitions when framer's `animate()` also stalled in hidden tabs.
8. Wired everything in `LandingPage`; fixed mobile banner clipping by adding right-padding to the banner and tightening `SuperTutorsLockup` `lg` mobile sizes; hid arrow chrome on mobile.
9. **User pivot:** removed arrow chrome, bumped cards to full width, no peek.
10. **User pivot:** added wheel-scroll nav; first pass used fixed cooldown.
11. Iterated wheel handler: cooldown → gesture-end rest timer → rest timer + `MIN_LOCK_MS` hard floor + `lastNavSign` direction-reversal handling. Verified each iteration with synthetic wheel events.
12. **User pivot:** carousel still feels buggy + clicks confused with drags + scroll blocked after 2nd card + padding clipping. Researched Embla / Swiper / Lethargy patterns.
13. Installed `embla-carousel-react` + `embla-carousel-wheel-gestures`; replaced `LessonCarousel.tsx` (~250 lines → ~90 lines).
14. Restructured `LandingPage` so banner stays inside `max-w` padded container and carousel viewport is full screen width; each slide reapplies the same padding so the active card visually aligns with the banner.
15. Hit Vite optimized-deps cache mismatch (`Cannot read properties of null (reading 'useRef')`) after navigating away and back; cleared `node_modules/.vite` and restarted the dev server — clean.

---

## Open Threads / Next Steps

- **Verify in a real browser.** Headless preview's hidden-tab `requestAnimationFrame` throttling masks Embla's animated transitions and the wheel-gestures plugin's full behavior. User has not yet hands-on tested the Embla version.
- **Glyph polish.** The `LaurelGlyph` SVG on the Acutis poster reads more like an oval pod than a laurel wreath at low opacity — fine as background decoration, but could be swapped for the existing `LaurelMark` asset or a refined SVG.
- **Potential simplifications now that Embla owns the carousel:** `goPrev` / `goNext` / pointer-drag scaffolding from earlier iterations is gone, but other landing components could probably be tightened similarly.

---

## External References

- [Embla Carousel — React docs](https://www.embla-carousel.com/get-started/react/)
- [Embla Carousel — WheelGestures plugin](https://www.embla-carousel.com/plugins/wheel-gestures/)
- [wheel-gestures (underlying inertia-detection library)](https://github.com/xiel/wheel-gestures)
- [Lethargy — distinguishing real scroll from inertia decay](https://github.com/d4nyll/lethargy)
- [Swiper — MousewheelOptions (`thresholdDelta`, `thresholdTime`)](https://swiperjs.com/types/interfaces/types_modules_mousewheel.MousewheelOptions)
- [Motion+ Carousel — wheelSwipe deceleration monitoring](https://motion.dev/blog/introducing-the-motion-carousel)
