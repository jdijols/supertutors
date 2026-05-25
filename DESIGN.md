# Design System — SuperTutors

> **For AI agents:** Read this file before making any visual or UI decision. Every
> color, font, spacing value, radius, motion token, and component pattern described
> here is derived from the live production codebase. Do not deviate without explicit
> user approval. In QA mode, flag any code that contradicts a token here.

---

## Product Context

- **What this is:** A kid-facing AI tutor platform. One lesson per subject, one character per lesson, one deliberate experience per session.
- **Who it's for:** Kids (primary users) + parents and educators (secondary). Kids need the UI to feel like a game. Adults need it to feel trustworthy.
- **Space/industry:** EdTech / AI-native learning tools.
- **Project type:** Interactive lesson app — iPad-first, full-screen, no scroll.
- **Parent brand:** Superbuilders — monochrome + warm pewter accent. SuperTutors inherits this palette for all chrome surfaces.
- **Memorable thing:** "The AI tutor that feels like playing, not studying."

---

## Two Design Layers

SuperTutors has two distinct visual layers that must coexist. Every UI decision needs to declare which layer it belongs to.

| Layer | Scope | Palette | Font |
|-------|-------|---------|------|
| **Platform chrome** | Landing page, nav, lesson chrome (buttons, modal, lockup) | `sb.*` tokens | Geist Mono |
| **Lesson world** | In-lesson interactive scene, characters, feedback states | Lesson-specific palette (see below) | Inter (body), Geist Mono (labels) |

---

## Aesthetic Direction

- **Direction:** Editorial / Industrial Monospace
- **Decoration level:** Minimal — type and contrast do all the work; decoration is occasional and purposeful (hatching texture at 2.5% opacity, radial-gradient backgrounds)
- **Mood:** Serious enough for parents. Fun enough for kids. Freddy is the warmth — the chrome is the stage.
- **Reference aesthetic:** Brutalist editorial (thick 2px borders, monospace labels, high contrast) meets warm children's product (cream surfaces, rounded cards, spring physics).

**Design rules that hold everywhere:**
- `active = dark` — whenever a UI element is in an active/on state, it **contrasts maximally with the page background**. On light surfaces (cream, sb-surface): active = `bg-sb-ink text-white`. On dark surfaces (ink, landing page): active = `bg-sb-paper text-sb-ink`. The rule is about contrast direction, not an absolute color. See "Surface-dependent state inversions" below.
- `Border hierarchy:` thick `border-2 border-sb-ink` = top-level chrome elements; `border border-sb-ink/10` = sub-items inside chrome containers.
- Touch targets: min 56×56px (h-14 w-14) on mobile, 64×64px (h-16 w-16) on tablet. Kids can't aim precisely.

---

## Typography

### Active fonts (loaded in production)

Both fonts are loaded via Google Fonts in `index.html`:

```
Geist Mono: wght@400;500;600;700
Inter: wght@400;500;600;700
```

| Role | Font | Class | Notes |
|------|------|-------|-------|
| **Hero / wordmark / chrome labels** | Geist Mono | `font-mono` | Primary brand font. Used for the SUPERTUTORS wordmark, lesson numbers, eyebrow labels, meta strips, button text, card titles — everything chrome-level. |
| **Body / prose / speech** | Inter | `font-sans` | Used for body copy, the SpeechBubble text, modal prose, form inputs. |

**Geist Mono is the brand voice.** When in doubt about which font to use, if something is a label, heading, or UI element → Geist Mono. If it's a sentence to read → Inter.

### Typography scale (production values)

| Name | Size | Weight | Tracking | Case | Usage |
|------|------|--------|----------|------|-------|
| Eyebrow / meta | 11px | 400 | `tracking-[0.18em–0.22em]` | UPPERCASE | Lesson number, ~5 min, "About", "Coming soon" |
| Body small | 13–15px | 400/500 | default | sentence | Card descriptions, modal copy |
| Body | base (16px) | 400 | default | sentence | SpeechBubble, modal paragraphs, input text |
| Hero small | 28px | 700 | `tracking-[-0.02em]` | mixed | Poster card titles at mobile breakpoint |
| Hero medium | 36–40px | 700 | `tracking-[-0.02em]` | mixed | Poster card titles at tablet |
| Hero large | 60–100px | 700 | `tracking-[-0.02em]` | mixed | Poster card titles at desktop; lockup wordmark |

**Outline text pattern:** Used on the second line of poster card headings and the "TUTORS" half of the lockup. CSS: `WebkitTextStrokeWidth: "1px"`, `WebkitTextFillColor: "transparent"`, `paintOrder: "stroke fill"`. Creates negative-space text against the card background.

### Deprecated fonts (defined in tailwind.config but NOT loaded and NOT used in production)

- `Fredoka` (font-display) — was the intended kid-facing display font; never loaded in index.html; any `font-display` classname falls back to `system-ui`. Not part of the live design.
- `Nunito` (font-body) — was the intended body font; `font-body` class exists in tailwind.config but is never used anywhere in the codebase.

Do NOT add `<link>` tags for Fredoka or Nunito without explicit user decision to adopt them.

---

## Color

### Platform chrome palette (sb.* — primary design system)

These are the live tokens used across all platform chrome, the landing page, lesson chrome, and the overlay modal.

```
--sb-ink:          #1A1A1A   ← near-black; primary text, borders, active-state backgrounds
--sb-surface:      #F5F5F5   ← page background (landing page body)
--sb-card:         #FFFFFF   ← card/modal surface; also used for hover states on sub-items
--sb-border:       #E5E5E5   ← neutral borders, Coming Soon chip borders
--sb-muted:        #5B5B5B   ← secondary text (descriptions, meta, placeholder)
--sb-subtle:       #A3A3A3   ← tertiary text (rarely used; decorative)
--sb-accent:       #BFA68A   ← warm pewter / champagne; focus rings, accent highlights
--sb-accent-soft:  #E8DECC   ← lightest accent wash
--sb-accent-deep:  #8C7556   ← darkest accent; shadow color (shadow-sb-accent-deep/25)
--sb-paper:        #EFE7DA   ← primary warm UI surface; at-rest state for chrome buttons
--sb-paper-deep:   #F1E5D0   ← warmer hover state for paper elements
--sb-paper-soft:   #F5F2EC   ← palest warm tone; subtle warmth
```

**How to apply:**
- Page background → `bg-sb-surface`
- Cards, modals → `bg-sb-card`
- All body text → `text-sb-ink`
- Secondary/caption text → `text-sb-muted`
- Chrome buttons at rest → `bg-sb-paper`, hover → `bg-sb-paper-deep`
- Chrome buttons active → `bg-sb-ink text-white`
- Borders (top-level chrome) → `border-2 border-sb-ink`
- Borders (sub-items) → `border border-sb-ink/10`
- Shadows → `shadow-xl shadow-sb-accent-deep/25`
- Focus rings → `focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2`

### Lesson world palette (Freddy Fractions — Italian-American pizza theme)

Used only inside the Freddy Fractions lesson: pizza piece colors, feedback states, celebration animations. Do NOT use these tokens for chrome elements.

```
mozzarella-50:   #FFFBF2   ← lightest cream; pizza dough base
mozzarella-100:  #FFF4DC
mozzarella-200:  #FCE9BA
mozzarella-300:  #F4D996

terracotta-300:  #DB8757   ← tomato sauce highlight
terracotta-400:  #C76833
terracotta-500:  #A04D22   ← deeper terracotta
terracotta-600:  #7E3A17   ← Acutis Coming Soon ribbon accent

basil-400:       #6CA64A   ← correct-answer feedback (green ring)
oven-glow:       #F2A93B   ← pending / incorrect-answer state (warm amber); AhaAnimation text
```

**Lesson world semantic usage:**
- Correct answer → `bg-basil-400 text-mozzarella-50 ring-4 ring-basil-400/40`
- Incorrect/pending → `bg-mozzarella-50 text-oven-glow ring-4 ring-oven-glow/40`
- `oven-glow` text in AhaAnimation → `text-oven-glow drop-shadow-[0_8px_24px_rgba(26,26,26,0.35)]`

### Coming Soon card palette (per-lesson, applied via theme prop)

```
acutisTheme.background: radial-gradient(ellipse at 75% 80%, #F0E4D0 0%, #E8DCC1 50%, #F5EFE2 100%)
acutisTheme.accent:     #7E3A17   (terracotta-600)
aslTheme.background:    radial-gradient(ellipse at 75% 80%, #D5E5F2 0%, #BFD5EB 50%, #EAF3FA 100%)
aslTheme.accent:        #1A2237   (sb-ink-equivalent deep navy)
```

### Deprecated tokens (defined but not in production)

- `portal.*` — was an early landing palette concept (blue-toned). Only referenced in `TutorCard.tsx`, which is dead code (not imported anywhere). Do not use.
- `tomato.*` — only in `ErrorBoundary` (rarely triggered) and `VoicePreview` (dev tool). Not part of production UI.

---

## Spacing

- **Base unit:** 4px
- **Scale in use:** Standard Tailwind (4px grid)
- **Density:** Comfortable — generous whitespace signals quality; not so generous that it wastes the limited screen real estate on an iPad.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px (p-1) | Icon internal padding |
| sm | 8px (p-2) | Sub-item internal padding |
| md | 16px (p-4) | Standard content padding |
| lg | 24px (p-6) | Card internal padding (mobile) |
| xl | 32px (p-8) | Card internal padding (desktop) |
| 2xl | 48px | Section gap |

**Chrome button positioning:** Fixed top-right. Right offset: `right-4 sm:right-6`. Top offset: `top-4 sm:top-6`. When two chrome buttons are adjacent (Exit + Mute), Exit sits at `right-20 sm:right-24`, Mute at `right-4 sm:right-6`.

**Max content width:** `max-w-[1280px]` with `px-4 sm:px-6 md:px-8` horizontal padding. The carousel viewport breaks out to full screen width; each slide re-applies the padding internally.

---

## Layout

- **Approach:** iPad-first — the primary device. Design for `820×1180` (iPad Air portrait) and verify on `1180×820` (landscape). Desktop is progressive enhancement.
- **Viewport:** `h-[100dvh]` everywhere. No scroll. `overflow: hidden` on html/body/#root. Uses `dvh`/`dvw` (dynamic viewport units) to account for Safari status bar.
- **Grid:** Single-column, full screen on lesson views. Landing: bento grid (see below).
- **Poster card min-height:** `min-h-[420px] md:min-h-[520px]`.

### Bento layout spec (landing page)

The landing page is a full-viewport 5-column × 2-row CSS grid on `sb-ink` background.

```tsx
<div className="grid grid-cols-1 md:grid-cols-5 grid-rows-4 md:grid-rows-2 gap-4 sm:gap-5 md:gap-6 flex-1 min-h-0">
  <BrainliftCard className="md:col-span-2 md:row-span-1" />   {/* Row 1, 2/5 */}
  <ASLPosterCard  className="md:col-span-3 md:row-span-1" />  {/* Row 1, 3/5 */}
  <FreddyPosterCard className="md:col-span-3 md:row-span-1" /> {/* Row 2, 3/5 */}
  <AboutCard className="md:col-span-2 md:row-span-1" />       {/* Row 2, 2/5 */}
</div>
```

- Page outer padding: `px-6 sm:px-8 md:px-12 lg:px-16 py-6 sm:py-8 md:py-10`
- Card gaps: `gap-4 sm:gap-5 md:gap-6`
- Mobile: collapses to single column (`grid-cols-1`), 4 rows; order is BrainLift → ASL → Freddy → About
- Header row: `h-14 sm:h-16`, SuperTutorsLockup `size="inline"` left-aligned; chrome buttons float fixed top-right
- **Border radius scale:**

| Name | Value | Usage |
|------|-------|-------|
| sm | 8px (rounded-lg) | Sub-item hover bg |
| md | 12–16px (rounded-xl / rounded-2xl) | Chrome buttons, input fields |
| lg | 22px (rounded-[22px]) | Poster cards, banner, main modal |
| full | 9999px (rounded-full) | Dot indicators, pill chips, Coming Soon buttons |

---

## Motion

**Library:** framer-motion for chrome buttons and poster cards. CSS transitions for modals and overlays (CSS transitions survive when the browser tab is hidden; framer-motion's `requestAnimationFrame` stalls in hidden tabs).

### Spring tokens

| Name | Stiffness | Damping | Usage |
|------|-----------|---------|-------|
| Chrome button | 600 | 22 | MuteToggle, ExitButton, UserMenu hover/tap |
| Poster card | 380 | 26 | FreddyPosterCard, ASLPosterCard, BrainliftCard hover/tap |

### Scale values

| State | Chrome buttons | Poster cards |
|-------|---------------|--------------|
| hover | `scale: 1.04` | `y: -3` |
| tap | `scale: 0.92` | `scale: 0.995` |

### CSS transition timing

- Standard chrome: `transition-colors duration-200`
- Modal enter: `translate-y-0 scale-100 opacity-100` (from `translate-y-2 scale-[0.98] opacity-0`), `transition-all duration-200 ease-out`
- Hover gaps (arrow indicators): `gap-2 → gap-3`, `transition-[gap] duration-300`

### Keyframe animations

```css
deliveryBoxPulse: scale 1→1.06 over 1.4s ease-in-out infinite
  (used when pizza table is at capacity — "send pizzas away" hint)

spotlightPulse: scale 1→1.12 + drop-shadow(0 0 18px rgba(255,220,140,0.85)) over 1.1s
  (used on the UI element Freddy is currently highlighting in the tour)
```

---

## Component Patterns

### Chrome button (MuteToggle / ExitButton / InfoToggle / CvToggle)

```tsx
// Base className — copy exactly:
"fixed [position] z-[60]
 w-14 h-14 sm:w-16 sm:h-16
 rounded-2xl border-2 border-sb-ink
 shadow-xl shadow-sb-accent-deep/25
 flex items-center justify-center cursor-pointer
 transition-colors duration-200
 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent
 focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface"

// Active state (feature ON):
"bg-sb-ink text-white"

// Rest state (feature OFF):
"bg-sb-paper text-sb-ink hover:bg-sb-paper-deep"

// Framer motion:
whileHover={{ scale: 1.04 }}
whileTap={{ scale: 0.92 }}
transition={{ type: "spring", stiffness: 600, damping: 22 }}
```

### Poster card (FreddyPosterCard / ComingSoonPosterCard)

```tsx
// Base:
"group relative overflow-hidden rounded-[22px] border border-sb-border
 bg-sb-card text-left focus:outline-none
 focus-visible:ring-2 focus-visible:ring-sb-accent
 focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
 w-full h-full"

// Background: radial-gradient (each card has its own)
// Hatch texture: repeating-linear-gradient(45deg, #1A1A1A 0 1px, transparent 1px 8px) opacity-[0.025] mix-blend-multiply

// Eyebrow label:
"font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep"

// Meta strip (bottom):
"font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted"

// Hero title:
"font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-ink"
// Second line uses the outline-text pattern (WebkitTextStrokeWidth: "1px", WebkitTextFillColor: "transparent")

// Bottom strip separator:
"border-t border-sb-ink/10"

// Spring:
whileHover={{ y: -3 }}
whileTap={{ scale: 0.995 }}
transition={{ type: "spring", stiffness: 380, damping: 26 }}
```

### Modal / overlay

```tsx
// Backdrop:
"fixed inset-0 bg-sb-ink/60 backdrop-blur-sm"

// Dialog panel:
"relative w-full max-w-[720px] max-h-[90dvh] overflow-auto
 rounded-[22px] bg-sb-card border border-sb-border
 p-7 sm:p-9 md:p-12
 shadow-2xl shadow-sb-ink/30"

// Enter state: translate-y-0 scale-100 opacity-100
// Exit state: translate-y-2 scale-[0.98] opacity-0
// Transition: duration-200 ease-out (CSS, not framer-motion)
```

### SpeechBubble (lesson world)

```tsx
"bg-sb-paper border-2 border-sb-ink rounded-3xl
 shadow-xl shadow-sb-accent-deep/25
 text-sb-ink font-sans text-xl leading-snug"

// Speaker label inside bubble:
"text-[11px] font-mono uppercase tracking-[0.18em] text-sb-ink/70"
```

### Form input (NameInputOverlay pattern)

```tsx
// Input field:
"text-lg font-sans py-2.5 px-4 rounded-xl
 bg-sb-card border-2 border-sb-border
 focus:border-sb-ink focus:outline-none
 focus-visible:ring-2 focus-visible:ring-sb-accent
 focus-visible:ring-offset-2 focus-visible:ring-offset-sb-paper
 text-sb-ink placeholder:text-sb-muted
 transition-colors duration-200"

// Submit button:
"w-12 h-12 grid place-items-center rounded-xl
 bg-sb-ink text-white
 shadow-xl shadow-sb-accent-deep/25
 hover:bg-sb-ink/90 disabled:opacity-40"
```

### Eyebrow / label pattern

```tsx
// Used everywhere: lesson number, "About", meta strips, "Coming soon"
"font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted"
// Variant with accent:
"font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep"
```

### SuperTutors wordmark / lockup

```tsx
// Always font-mono bold; two-tone text split:
// Line 1 fill: solid (white on dark, ink on light)
// Line 2 outline: WebkitTextStrokeWidth 1px, WebkitTextFillColor transparent
// Letter-spacing: tracking-[-0.02em]
// Line-height: leading-[0.92]
```

---

## Surface-Dependent State Inversions

The `active = dark` rule is about **maximum contrast with the page background**, not a fixed color.

| Surface | Page bg | Active state | Rest state |
|---------|---------|--------------|------------|
| Light (lesson, modal) | `sb-surface` / `sb-card` | `bg-sb-ink text-white` | `bg-sb-paper text-sb-ink` |
| Dark (landing page) | `sb-ink` | `bg-sb-paper text-sb-ink` | `bg-sb-paper text-sb-ink` |

On the dark landing page both active and rest use `bg-sb-paper` — the icon (speaker waves vs. muted X) carries the semantic distinction.

**Implementation pattern:** Chrome buttons that render on multiple surfaces accept a `surface?: "light" | "dark"` prop (default `"light"`). `App.tsx` detects `location.pathname === "/"` and passes `surface="dark"` on the landing route. `UserMenu` detects the surface internally via its existing `useLocation` hook.

**Focus ring offsets** follow the same rule: `ring-offset-sb-surface` on light, `ring-offset-sb-ink` on dark.

---

## Card Style Families

Three distinct visual languages for landing cards:

| Family | Example | Background | Glyph / Art | Interaction |
|--------|---------|------------|-------------|-------------|
| **Lesson poster** | FreddyPosterCard, ASLPosterCard | Warm radial gradient (cream/sky) | Character or hand glyph at 35% opacity | hover `y:-3`, tap `scale:0.995`, spring 380/26 |
| **Document card** | BrainliftCard | Parchment radial gradient | Scroll glyph at 12% opacity | Same spring |
| **Colophon card** | AboutCard | `bg-white/[0.03]` on ink | None | No hover lift; focus ring only |

All cards share: `rounded-[22px]`, `border border-white/10`, `focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-sb-ink`.

---

## Markdown Rendering

For any markdown surfaced in-app, the canonical pattern is:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

<article className="prose prose-invert prose-sb max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
</article>
```

- `@tailwindcss/typography` plugin registered in `tailwind.config.js`
- `prose-invert` for dark-surface rendering
- Vite `?raw` import for compile-time markdown bundling (no runtime fetch)
- Viewer component: `BrainliftViewer` (`src/lessons/acutis/BrainliftViewer.tsx`) — rendered/raw toggle, copy, download

---

## Custom Cursor System

The lesson uses a DOM-based cursor sprite (`ToolSprite`) — the OS cursor is hidden entirely via `cursor: none !important` on `html.tool-glove` / `html.tool-cutter`. This was adopted after Chrome on macOS silently failed to render `cursor: url(...)` in some regions.

- CV tracking visualization: idle dots → `#EFE7DA` (sb-paper); pinch state → `#1A1A1A` (sb-ink).
- Touch devices: cursor sprite hides on `pointerup` (touch/pen). Always visible for mouse.

---

## Accessibility

- All interactive elements have `focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2`.
- WCAG AA contrast minimum throughout. Key pairs: sb-ink (#1A1A1A) on sb-paper (#EFE7DA) ≈ 12:1 (AAA). White on sb-ink (#1A1A1A) ≈ 14:1 (AAA).
- Safari `100dvh` + `overflow: hidden` prevents scroll-triggered address-bar collapse from resizing the lesson layout mid-session.
- Tap targets: minimum 56×56px; 64×64px at sm breakpoint.
- Touch: `-webkit-touch-callout: none` and `-webkit-user-drag: none` globally on `img` (prevents iOS save/share callout from interfering with pizza drag gestures).
- `-webkit-tap-highlight-color: transparent` on body.

---

## Font Loading

```html
<!-- index.html — these are the ONLY fonts loaded in production -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

Note: `PP Variant Mono` (Pangram Pangram) is the Superbuilders parent brand wordmark font. The codebase uses `Geist Mono` as the closest free analogue. Swap to PP Variant Mono once a license is in place and the woff2 file is in `/public/fonts/`.

---

## What Is NOT Part of This Design System

The following are defined in `tailwind.config.js` but are **not active in production**. Do not use them for new UI.

| Token / font | Status | Reason |
|---|---|---|
| `portal.*` | Dead code | Only referenced in `TutorCard.tsx`, which has no importers |
| `tomato.*` | Dev/error only | Only in ErrorBoundary + VoicePreview dev tool |
| `Fredoka` / `font-display` | Not loaded | Not in index.html; falls back to system-ui |
| `Nunito` / `font-body` | Never used | `font-body` class has zero occurrences in the codebase |
| `TutorCard.tsx` | Dead code | Superseded by FreddyPosterCard + ComingSoonPosterCard carousel |

---

## Agent Instructions (Claude Code / Cursor / Copilot)

1. **Before writing any UI:** Check whether this file defines a token for what you need. If yes, use the exact value. If no, flag the gap rather than inventing a new value.
2. **Font choice:** `font-mono` (Geist Mono) for labels, chrome, headings. `font-sans` (Inter) for prose, speech, and form text. No other fonts without user approval.
3. **New chrome buttons** must follow the chrome button pattern exactly — same dimensions, border, shadow, spring physics, and active/rest state logic.
4. **New lesson-world elements** use the lesson palette (mozzarella, terracotta, basil, oven-glow). Do not bleed lesson colors into platform chrome.
5. **Focus rings** are always `focus-visible:ring-2 focus-visible:ring-sb-accent`. Never `focus:ring-*` — that fires on click too, which is distracting.
6. **Shadows** use `shadow-sb-accent-deep/25` (warm champagne shadow). Never `shadow-black` or `shadow-gray`.
7. **The `active = dark` rule is absolute.** If a toggle/button is in an ON state, its background is `sb-ink` and its icon inverts to white. No exceptions.
8. **Motion:** Chrome elements use stiffness 600 / damping 22. Cards use 380 / 26. Modal enter/exit uses CSS transitions (not framer-motion) to survive hidden-tab throttling.
9. **Viewport:** Always `h-[100dvh]`, never `h-screen` or `h-[100vh]`. Always `dvh`/`dvw` for math-based sizing inside the lesson world.
10. **Never add `Nunito`, `Fredoka`, or `portal.*` tokens** to production UI without explicit user confirmation that these are being adopted.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-19 | Switched from Midjourney to ChatGPT (gpt-image-1) for character art | MJ Style Creator couldn't converge on Pixar/Duolingo cartoon style; ChatGPT preserved style continuity within a single thread |
| 2026-05-19 | Geist Mono adopted as primary brand font; Inter as body | `PP Variant Mono` (parent brand) is a paid Pangram Pangram font; Geist Mono is the closest free analogue. Inter is the neutral body fallback |
| 2026-05-21 | `active = dark` established as system-wide rule | MuteToggle was inverted (dark = muted). Flipped so dark = active (playing), matching CvToggle + ToolPicker pattern. Consistency over legacy behavior |
| 2026-05-21 | Sub-item border: `border-sb-ink/10` (thin, faint) | Sub-items inside containers recede at rest. Only top-level chrome carries `border-2 border-sb-ink` |
| 2026-05-21 | CV tracking visualization: ink + paper (not terracotta) | Terracotta was a leftover debug color. Ink/paper makes finger-tracking first-class chrome, not debug scaffolding |
| 2026-05-21 | Custom DOM cursor sprite over `cursor: url()` | Chrome on macOS silently failed to render cursor URLs in certain regions even with correct computed styles |
| 2026-05-21 | `overflow: hidden` on html/body/#root; `100dvh` everywhere | Safari status bar was eating the bottom of the lesson. `dvh` also required for counter overlay math |
| 2026-05-21 | Drop-shadow gated on `!isDragging` | `drop-shadow` filter on transformed elements leaves paint trails in Safari. `willChange: transform` added |
| 2026-05-25 | About card → full-screen modal behind InfoToggle | Landing surface stays focused on lesson posters. InfoToggle mirrors MuteToggle chrome exactly |
| 2026-05-25 | Carousel replaced custom implementation with Embla + WheelGestures | Hand-rolled wheel handler had inertia + click-vs-drag edge cases. Embla handles all of this natively |
| 2026-05-25 | Fredoka + Nunito not adopted | Neither font is loaded in index.html; both are placeholders from early design exploration. Geist Mono covers all display needs |
| 2026-05-25 | DESIGN.md created | Extracted all active design tokens from live production code. Audited stale tokens (portal, tomato, Fredoka, Nunito, TutorCard) — marked deprecated, not removed |
| 2026-05-26 | Landing inverted to dark surface; carousel → bento grid | Editorial ink-on-dark feel signals "SuperBuilders standalone platform." 4-card simultaneous view removes carousel hide-and-reveal. AboutModal removed (AboutCard inline). Acutis promoted from ComingSoonMount to BrainliftViewer. `active = dark` rule extended to surface-dependent inversions. |
