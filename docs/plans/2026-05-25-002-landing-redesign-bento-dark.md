# Landing Redesign — Bento on Ink

**Date drafted:** 2026-05-25 (~05:30 CDT, pre-implementation)
**Implementation target:** After overnight/ui-pass-0525 is reviewed and merged
**Branch when implementing:** `feat/landing-bento-redesign` (off main)
**Status:** Spec only. No code changes in this commit.

---

## TL;DR

Replace the current carousel-based, light-cream landing page with a 4-card bento grid on a near-black (`sb-ink`) surface. Add a new Acutis "BrainLift" card that opens the existing `/lessons/acutis` route as an in-app markdown viewer (rendered ↔ raw toggle, copy, download). Move About back from a modal to a bento card. Remove the InfoToggle chrome button entirely.

The existing design system (sb.* tokens, Geist Mono, Inter, spring physics) stays. What changes is which colors are foreground vs background, the layout primitive (bento, not carousel), and the addition of the document-viewer affordance.

---

## Goals

1. Land a darker, more editorial-feeling landing that signals "this is a SuperBuilders standalone platform," not a generic SaaS dashboard.
2. Surface 4 distinct entry points simultaneously (no carousel hide-and-reveal).
3. Make Acutis a first-class research artifact, not a "coming soon" placeholder.
4. Reduce chrome — fewer fixed-position buttons, more breathing room.

## Non-goals (explicit)

- No changes to lesson interiors (ASL practice screen, Freddy lesson world).
- No auth flow changes.
- No new fonts. No new color tokens.
- No mobile-specific carousel fallback. The bento collapses to a single column on small screens; we don't reintroduce swipe.

---

## Layout Spec

```
┌─ Full bleed bg: sb-ink (#1A1A1A) ───────────────────────────────────────┐
│                                                                          │
│  Padding: px-6 sm:px-8 md:px-12 lg:px-16   py-6 sm:py-8 md:py-10        │
│                                                                          │
│  ┌─ Top row (chrome line) ──────────────────────────────────────────┐   │
│  │  [◯ laurel] SUPERTUTORS                  [Mute] [Exit*] [User]   │   │
│  │  ← top-left aligned →                    ← top-right chrome →    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ Bento grid (flex-1, fills remaining viewport) ─────────────────┐    │
│  │                                                                  │    │
│  │  Row 1: 2fr-3fr split                                            │    │
│  │  ┌───────────────────┐  ┌──────────────────────────────────┐    │    │
│  │  │  BRAINLIFT (NEW)  │  │           ASL                    │    │    │
│  │  │   2/5 width       │  │        3/5 width                 │    │    │
│  │  │   parchment style │  │     active lesson poster         │    │    │
│  │  └───────────────────┘  └──────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │  Row 2: 3fr-2fr split                                            │    │
│  │  ┌──────────────────────────────────┐  ┌───────────────────┐    │    │
│  │  │         FREDDY                   │  │     ABOUT (NEW)   │    │    │
│  │  │      3/5 width                   │  │      2/5 width    │    │    │
│  │  │   active lesson poster           │  │    colophon style │    │    │
│  │  └──────────────────────────────────┘  └───────────────────┘    │    │
│  │                                                                  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

*ExitButton stays hidden on `/` (current behavior — it already hides on the landing route).

### Grid implementation

Use CSS Grid:

```tsx
<div className="grid grid-cols-5 grid-rows-2 gap-4 sm:gap-5 md:gap-6 flex-1 min-h-0">
  <BrainliftCard className="col-span-2 row-span-1" />
  <ASLPosterCard  className="col-span-3 row-span-1" />
  <FreddyPosterCard className="col-span-3 row-span-1" />
  <AboutCard className="col-span-2 row-span-1" />
</div>
```

**Mobile (< sm):** Collapse to single column, stack order ASL → Freddy → BrainLift → About (lessons first, secondaries second):
```
grid-cols-1 grid-rows-4
```

### Header / lockup spec

- **Laurel mark size:** `w-14 h-14 sm:w-16 sm:h-16` — same dimensions as a chrome icon button (currently `w-14 h-14 sm:w-16 sm:h-16` in MuteToggle).
- **Wordmark:** font-size and line-height matched to the laurel mark's height so the SUPERTUTORS text fits visually on one baseline-aligned row with the mark. The current `SuperTutorsLockup` `size="lg"` is way too large for this. Add a new size or override:
  ```
  text-[28px] sm:text-[32px] md:text-[36px]
  leading-[1.0]
  tracking-[-0.02em]
  font-mono font-bold
  ```
  Both lockup lines fit beside the laurel mark on a single horizontal axis.
- **Alignment:** the laurel + wordmark cluster sits **top-left**, the chrome cluster sits **top-right**. Both vertically centered to the same chrome-button height (~64px tall row).
- **No banner background.** The lockup sits on the bare `sb-ink` page background — no rounded-[22px] wrapper like the current version.

---

## Color Token Updates (apply to DESIGN.md AFTER overnight loop merges)

The existing `sb.*` palette is correct. What changes is **how it's applied**:

| Surface | Current | New |
|---|---|---|
| Page background | `bg-sb-surface` (#F5F5F5) | `bg-sb-ink` (#1A1A1A) |
| Page text default | `text-sb-ink` | `text-sb-paper-soft` (#F5F2EC) |
| Header eyebrow | `text-sb-muted` | `text-sb-paper/60` |
| Chrome button rest | `bg-sb-paper text-sb-ink` | unchanged (paper bg pops on ink page) |
| Chrome button active | `bg-sb-ink text-white` | `bg-sb-paper text-sb-ink` *(inverted — see note)* |
| Focus ring offset | `ring-offset-sb-surface` | `ring-offset-sb-ink` |
| Card outer border | `border-sb-border` (light) | `border-white/10` (subtle on ink) |

**`active = dark` rule problem:** the existing system says active toggles use `bg-sb-ink`. On an ink page, that disappears. We have two clean options:

**Option α (recommended):** Invert the rule for landing only. On dark surfaces, active = `bg-sb-paper text-sb-ink`. The rest of the app (lesson interiors, modals on cream) keeps the original rule. Document this in DESIGN.md as a context-dependent invariant: "active state contrasts maximally with the page background — that's the rule, the specific tokens depend on surface."

**Option β:** Active uses `bg-sb-accent` (warm pewter) on dark surfaces. Different look, harder to read.

Implement α. Add a section to DESIGN.md called "Surface-dependent state inversions."

---

## New Components

### 1. `src/platform/landing/BrainliftCard.tsx`

Distinct from the lesson posters. Signals "research / document, not lesson."

```
Visual:
- Background: warm parchment gradient
  `bg-[radial-gradient(ellipse_at_30%_40%,#F5EFE2_0%,#EFE7DA_60%,#E8DECC_100%)]`
- Subtle paper-grain texture overlay at 3-4% opacity
- No character art. A stylized manuscript / scroll glyph anchored bottom-right (similar pattern to LaurelGlyph in ComingSoonPosterCard, but with a document/page motif).
- Eyebrow: "BRAINLIFT" in font-mono uppercase tracking-[0.22em] text-sb-accent-deep
- Title: font-mono font-bold, two-line outline-text pattern matching the lesson posters but smaller scale (since the card is 2/5 width).
  "Acutis" (filled) / "INSTITUTE" (outlined)
- Subtitle: "A research brief on autonomous AI tutoring."
- Bottom strip: "Read brief →" — same font-mono tracking-[0.18em] uppercase pattern as the lesson posters
- Hover/tap: framer spring (380/26 — matches poster cards)
```

Props:
```ts
{
  onActivate: () => void;  // navigate to /lessons/acutis
  className?: string;
}
```

### 2. `src/lessons/acutis/Mount.tsx` (REPLACE the current ComingSoonMount)

The Acutis route now renders the BrainLift markdown viewer.

```ts
// src/lessons/acutis/Mount.tsx
import { BrainliftViewer } from "./BrainliftViewer";
import brainliftMd from "../../../Acutis-Institute/Acutis-Institute_Brainlift.md?raw";

export default function AcutisMount() {
  return <BrainliftViewer markdown={brainliftMd} title="Acutis Institute — BrainLift" />;
}
```

Vite's `?raw` import suffix returns the raw markdown string at build time. No runtime fetch needed.

### 3. `src/lessons/acutis/BrainliftViewer.tsx` (NEW)

Full-screen viewer with a header bar and a toggle.

```
Layout:
- Full bleed bg: sb-ink
- Top bar (~64px): same chrome alignment as landing
  - Left: ExitButton (already exists, will now render on this route)
  - Center: Title "Acutis Institute — BrainLift" in font-mono
  - Right: Toggle (Rendered / Raw) + Copy + Download icon buttons
- Body: max-w-prose mx-auto, py-12, overflow-y-auto

Toggle state: useState<'rendered' | 'raw'>('rendered')

Rendered mode:
  <article className="prose prose-invert prose-sb max-w-none">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
  </article>

Raw mode:
  <pre className="font-mono text-sm text-sb-paper-soft whitespace-pre-wrap">
    {markdown}
  </pre>

Copy button: navigator.clipboard.writeText(markdown). Toast "Copied to clipboard."
Download button: createObjectURL(new Blob([markdown], {type: 'text/markdown'})), trigger anchor download with filename "acutis-institute-brainlift.md".
```

Toggle component spec:

```tsx
<div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
  <button
    className={cn(
      "px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-[0.16em]",
      mode === 'rendered'
        ? "bg-sb-paper text-sb-ink"  // active = paper on ink
        : "text-sb-paper/60 hover:text-sb-paper"
    )}
  >Rendered</button>
  <button className={...}>Raw</button>
</div>
```

### 4. `src/platform/landing/AboutCard.tsx` (NEW, replaces AboutModal usage)

```
Visual:
- Background: bg-sb-ink (matches page) with border-white/10
  OR a slightly elevated tone: bg-white/[0.03]
- This is the "colophon" — minimal, monochrome on monochrome, intentionally recessive
- Content (lifted from current AboutModal):
  - Eyebrow: "ABOUT" font-mono uppercase tracking-[0.18em] text-sb-paper/60
  - Headline: "Tutors for the AI generation." font-mono font-bold (smaller than lesson posters since 2/5 width)
  - Body paragraph: text-sb-paper-soft/80 max-w-[44ch]
  - Footer strip: "A SuperBuilders project" font-mono uppercase tracking-[0.22em] text-sb-paper/40
- No CTA. The card itself is informational. Reading it is the interaction.
- No hover lift (it's not an entry point), but does keep focus ring for accessibility.
```

### 5. `src/lessons/asl/ASLPosterCard.tsx` (NEW — replaces the ASL Coming Soon poster)

ASL is now a shipped lesson, not "Coming Soon." Promote it to an active lesson poster matching FreddyPosterCard's structure.

```
Visual:
- Reuse aslTheme background (cool sky gradient) from current ComingSoonPosterCard
- No "Coming Soon" diagonal ribbon
- Eyebrow: "Lesson 02" + "~3 min"
- Title: "Learn / SIGNS" (two-line outline pattern)
- Subtitle: "with your camera at home."
- Character/glyph: SignHandGlyph (existing) anchored right
- Bottom strip: "Camera · Hand · Sign" + "Start →"
- Hover spring: 380/26
- onActivate: navigate to /lessons/asl
```

---

## Components to Remove or Refactor

| File | Action |
|---|---|
| `src/platform/landing/AboutModal.tsx` | Remove (functionality moves to AboutCard) |
| `src/platform/ui/InfoToggle.tsx` | Remove (no longer needed) |
| `src/platform/landing/LessonCarousel.tsx` | Remove (replaced by bento grid) |
| `src/platform/landing/ComingSoonPosterCard.tsx` | Keep file for the LaurelGlyph + SignHandGlyph exports, but no longer used as a card component on landing. ASL gets its own poster (above); Acutis gets BrainliftCard. Could be deleted entirely once glyphs are moved into the new card files. |
| `src/platform/landing/FreddyPosterCard.tsx` | Light refactor: tweak inner spacing now that it sits in a grid cell at 3/5 width rather than 100% width. Sizes likely scale down. |
| `src/platform/landing/LandingPage.tsx` | Rewrite: new lockup row + bento grid. No banner wrapper, no carousel, no modal, no InfoToggle. |
| `src/platform/landing/SuperTutorsLockup.tsx` | Add a new size variant `inline` for the lockup+laurel-same-height treatment. Or override via prop. |
| `package.json` | Remove `embla-carousel-react` + `embla-carousel-wheel-gestures` (no longer used). Add `react-markdown` + `remark-gfm`. |

---

## Routing

- `/` → LandingPage (bento)
- `/lessons/asl` → ASL practice (unchanged from current shipped behavior)
- `/lessons/freddy-fractions` → Freddy (unchanged)
- `/lessons/acutis` → **AcutisMount (NEW)** rendering BrainliftViewer (was ComingSoonMount)

The registry entry for Acutis stays the same slug. Its `meta.title` changes from "Coming Soon" to "Acutis Institute — BrainLift." Its `load()` returns the new Mount.

---

## Dependency Changes

```bash
npm install react-markdown@^9 remark-gfm@^4
npm uninstall embla-carousel-react embla-carousel-wheel-gestures
```

Tailwind typography plugin for the `prose` classes on rendered markdown:

```bash
npm install -D @tailwindcss/typography
```

Then update `tailwind.config.js`:

```js
plugins: [require('@tailwindcss/typography')]
```

Add a custom prose theme variant `prose-sb` that styles markdown for the ink-on-paper-soft palette:

```js
typography: ({ theme }) => ({
  sb: {
    css: {
      '--tw-prose-body': theme('colors.sb.paper-soft'),
      '--tw-prose-headings': theme('colors.white'),
      '--tw-prose-links': theme('colors.sb.accent'),
      '--tw-prose-code': theme('colors.sb.paper'),
      '--tw-prose-pre-bg': 'rgb(255 255 255 / 0.05)',
      // etc.
    }
  }
})
```

---

## DESIGN.md Updates (apply post-merge of overnight loop)

Add these sections to DESIGN.md AFTER the overnight loop merges:

1. **Surface-dependent state inversions.** Document that `active = dark` is a rule about *contrast direction*, not absolute color. On `sb-ink` surfaces, active inverts to `sb-paper text-sb-ink`.
2. **Bento layout spec.** New section under "Layout" describing the 5-column grid, 2-row, 2/5–3/5 split pattern for the landing.
3. **Card style families.** Three distinct card visual languages now:
   - Lesson posters (warm gradient + character art, ASL + Freddy)
   - Document cards (parchment + serif feel, BrainLift)
   - Colophon cards (monochrome on monochrome, About)
4. **Markdown rendering.** `react-markdown` + `remark-gfm` + Tailwind Typography with `prose-sb` variant is the canonical pattern for any markdown surfaced in-app.
5. **Decisions Log entry:** "2026-05-26 — Landing inverted from light to dark surface; carousel replaced with bento; AboutModal removed; Acutis promoted from ComingSoonMount to BrainliftViewer."

---

## File-by-File Implementation Checklist

In implementation order — each is a separate atomic commit.

1. **Add deps.** `npm install react-markdown remark-gfm @tailwindcss/typography`; `npm uninstall embla-carousel-react embla-carousel-wheel-gestures`. Commit: `chore: swap carousel deps for markdown rendering`.
2. **Tailwind typography.** Update `tailwind.config.js` with the plugin + `prose-sb` variant. Commit: `feat(design): add prose-sb typography variant`.
3. **BrainliftViewer.** Create `src/lessons/acutis/BrainliftViewer.tsx` + a test. Commit: `feat(acutis): markdown viewer with rendered/raw toggle, copy, download`.
4. **Acutis Mount swap.** Replace `src/lessons/acutis/Mount.tsx` content with the new viewer mount. Update `index.ts` if it re-exports anything. Commit: `feat(acutis): replace ComingSoonMount with BrainliftViewer`.
5. **BrainliftCard.** Create `src/platform/landing/BrainliftCard.tsx`. Commit: `feat(landing): brainlift card component`.
6. **ASLPosterCard.** Create `src/lessons/asl/ASLPosterCard.tsx`. Commit: `feat(landing): ASL active lesson poster card`.
7. **AboutCard.** Create `src/platform/landing/AboutCard.tsx`. Commit: `feat(landing): about card replaces about modal`.
8. **SuperTutorsLockup inline variant.** Add new size mode + alignment props. Commit: `feat(landing): lockup inline size variant`.
9. **LandingPage rewrite.** Replace `src/platform/landing/LandingPage.tsx` with the bento layout. Commit: `feat(landing): bento grid layout on ink surface`.
10. **Remove dead code.** Delete `AboutModal.tsx`, `InfoToggle.tsx`, `LessonCarousel.tsx`. Possibly `ComingSoonPosterCard.tsx` (move glyph exports first). Commit: `chore(landing): remove carousel, info toggle, about modal`.
11. **Active-state inversion utility.** Audit MuteToggle and any other chrome that uses the `active = sb-ink` rule. On the landing/dark surface they need to invert. Cleanest path: pass a `surface?: "light" | "dark"` prop to chrome buttons. Commit: `refactor(chrome): surface-aware active state inversion`.
12. **DESIGN.md update.** Apply the new sections described above. Commit: `docs(design): bento layout + dark surface + surface-dependent inversions`.
13. **e2e tests.**
    - `/` renders all 4 cards visible at once (no carousel discovery needed)
    - Click BrainLift card → navigates to `/lessons/acutis`
    - `/lessons/acutis` shows rendered markdown, toggle switches to raw view, copy button copies, download button triggers
    - About card has no click handler (or has one that does nothing — TBD)
    - Lockup is left-aligned, chrome is right-aligned, no banner wrapper
    Commit: `test(e2e): landing bento + brainlift viewer flows`.

---

## Testing Strategy

**Unit (Vitest):**
- `BrainliftViewer.test.tsx`: renders markdown to HTML in rendered mode, shows raw markdown in raw mode, copy button calls clipboard API, download triggers blob URL.
- `BrainliftCard.test.tsx`: onActivate fires on click, ARIA label present, keyboard activation works.
- `AboutCard.test.tsx`: renders the colophon copy correctly.
- `ASLPosterCard.test.tsx`: renders Lesson 02 eyebrow, onActivate fires.
- `LandingPage.test.tsx`: all 4 card components mount, no carousel present, header lockup is top-left.

**E2E (Playwright):**
- Full landing render at 1280×800 and at iPad portrait (820×1180).
- Screenshot regression — bento layout doesn't shift between signed-out and signed-in states (auth doesn't affect the card grid for now).
- Brainlift navigation: click card → URL is `/lessons/acutis` → markdown renders → toggle to raw → copy → download.

---

## Risks & Mitigations

1. **Active-state inversion ripple.** Changing `active = sb-ink` to a surface-dependent rule could affect MuteToggle, CvToggle, ToolPicker. Mitigation: introduce `surface` prop, default to "light" for backward compatibility, only landing passes "dark."
2. **Markdown bundle size.** `react-markdown` + `remark-gfm` is ~30KB gzipped. Acceptable for a feature this central; bigger than nothing but not a perf concern at our scale.
3. **`?raw` import compatibility.** Vite supports `?raw` natively. Verify in build, not just dev. Add an e2e check that the brainlift content renders in production build.
4. **ASL lesson "active" state.** Currently the carousel showed ASL as Coming Soon. The shipped feat/asl-pilot branch made ASL real. Some marketing copy may still imply ASL is upcoming — audit and update.
5. **Mobile bento collapse.** 5-column grid at desktop, 1-column at mobile. The hard part is the column-span attributes don't transfer cleanly. Use `grid-cols-1 md:grid-cols-5` and ensure each card explicitly resets `col-span` at the breakpoint.
6. **Conflict with overnight loop.** If the loop made changes to the existing LandingPage, AboutModal, or LessonCarousel, those changes are obsolete the moment this redesign lands. Mitigation: do a 5-min review of the overnight diff and cherry-pick only the changes that survive (focus rings, accessibility fixes, etc.). Layout changes get discarded.

---

## Open Questions for Implementation Morning

1. **About card click behavior.** Does the About card need any interaction (e.g., link to a longer "About" page), or is it purely informational? My read: purely informational. No nav. The card is its own content.
2. **Signed-out vs signed-in.** The bento layout doesn't visually differentiate auth state. The user mentioned both states matter. Open: do signed-out users see disabled cards with "Sign in to begin" overlays on the lesson cards, or do all four cards stay clickable and the lessons themselves gate on auth at the route level? Default: route-level gating (cards always clickable, /lessons/asl redirects to sign-in if not authenticated).
3. **BrainliftViewer typography.** Verify the `prose-sb` variant looks good against ink before locking colors. Adjust contrast if headings get lost.
4. **ExitButton on /lessons/acutis.** Currently ExitButton hides on `/`. Confirm it should show on `/lessons/acutis` (back to /) — I assume yes since acutis is a child route.
5. **Mute / User chrome positioning.** The header lockup goes top-left now. The chrome icon buttons (Mute, UserMenu) currently use `fixed top-4 right-4` etc. Do they stay fixed-positioned (always-on chrome) or do they live inline in the top header row? Inline is cleaner for the new layout but changes a lot of cross-app behavior. Default: keep fixed positioning, just ensure no visual collision with the lockup at any viewport.

---

## Estimated Effort

- Human + CC pair: ~3-4 hours of focused implementation work
- CC alone with TDD: ~6-8 iterations of the per-issue loop pattern, ~2.5 hours
- The riskiest piece is the surface-dependent active-state refactor — that's where most of the iteration time goes if it ripples wider than expected
