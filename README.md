# SuperTutors — Freddy Fractions

> A conversational AI math tutor that teaches fraction equivalence (1/2 = 2/4) to 9-year-olds through a Sicilian-pizza manipulative. Built for the Week 4 Gauntlet challenger project (clone Synthesis Tutor).

**Live:** [supertutors.vercel.app](https://supertutors.vercel.app) — onboarding → exploration tour → scripted **Share the Pizza** lesson (fraction equivalence) → Win, with optional CV physical mode

**Demo video:** _to be added before noon 2026-05-22 — placeholder: [https://www.loom.com/share/TODO](https://www.loom.com/share/TODO)_

> **Submission deliverables**
>
> | Requirement | Status |
> |---|---|
> | Working prototype of a single math lesson on fraction equivalence | Live at [/lesson](https://supertutors.vercel.app/lesson) |
> | Web-based app, runnable in a standard browser | Yes — Vite + React, no install |
> | 1–2 min demo video showing conversational flow + interactive fraction manipulative | _Placeholder above — recording 2026-05-22 AM_ |
> | README with run instructions + technical approach overview | This document — see [Setup](#setup) and [Technical decisions](#technical-decisions) |

---

## 🎥 CV mode (BEMO-style physical interaction)

Slice pizzas with your hands. SuperSlice ships an opt-in "physical mode" powered by [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js) running entirely in the browser via WebAssembly. No installs. No server. No video data leaves your device — all hand-landmark inference runs locally.

Inspired by [Patrick Skinner's work on BEMO](https://playbemo.com/) — the thesis that CV-driven physical manipulatives make math learning qualitatively different from pointing at a screen.

**Try it:**

- [Lesson with CV mode](https://supertutors.vercel.app/lesson?skip=true&cv=true) — skips onboarding into the manipulative with the webcam tracker enabled; pinch + drag in front of your camera to slice
- [CV preview](https://supertutors.vercel.app/preview/cv) — live hand-landmark overlay + pinch detector debug view

**How it works:**

- **Open hand** → index fingertip drives the on-screen cursor (highlighted orange)
- **Pinch (thumb tip ↔ index tip)** → pointer-down; drag begins
- **Pinch release** → pointer-up; cut or move completes
- Hysteresis prevents jitter: enter pinch at 70% finger closure, exit at 40%
- Exponential smoothing (α = 0.4) on pinch center for stable dragging

**Architecture:** CV layer is fully decoupled — it fires synthetic pointer events. Zero changes to the slice/drag logic.

```
useHandLandmarks()       ← webcam → MediaPipe → 21 landmarks/30fps
  └─ PinchRecognizer     ← stateful hysteresis + smoothing
       └─ usePointerFromHand  ← synthetic PointerEvents
            └─ existing slice + drag handlers  ← untouched
```

**Privacy:** permission requested once per session. No frames leave the device.

**Further reading:**

- [MediaPipe Hands docs](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js)
- [CV in Education brainlift](./References/Education-via-Computer-Vision.md)
- [iPad roadmap (v1.0 → v2.5)](./deliverables/ipad-roadmap.md)

---

## Demo

**Live links:**

| URL | What it shows |
|---|---|
| [supertutors.vercel.app](https://supertutors.vercel.app) | Landing + lesson entry |
| [/lesson](https://supertutors.vercel.app/lesson) | Full production flow — onboarding → exploration tour → **Share the Pizza** scripted lesson → Win |
| [/lesson?lesson=scripted](https://supertutors.vercel.app/lesson?lesson=scripted) | Jump directly into the scripted lesson (name = "Chef") |
| [/lesson?skip=true](https://supertutors.vercel.app/lesson?skip=true) | Skip onboarding, drop into exploration sandbox (name = "Chef") |
| [/lesson?skip=true&cv=true](https://supertutors.vercel.app/lesson?skip=true&cv=true) | Same shortcut + CV physical mode pre-armed |
| [/preview/cv](https://supertutors.vercel.app/preview/cv) | Hand landmark debug overlay |
| [/lesson?beat=aha&demo=true](https://supertutors.vercel.app/lesson?beat=aha&demo=true) | Beat 6 (AHA) state machine with dev controls |

**Demo mode shortcuts** (append `?demo=true` to any URL):

| Key | Destination |
|---|---|
| `0` | CV preview (`/preview/cv`) |
| `1` | Landing |
| `2` | Sandbox / Explore (`/lesson?skip=true` — skips onboarding into the manipulative) |
| `6` | Beat 6 (AHA) — the hero demo moment with voice |
| `8` | Beat 8 (Win) — confetti celebration |
| `C` | Lesson + CV mode (`/lesson?skip=true&cv=true`) |
| `Shift+R` | Reload current page |

**Demo video:** see [`deliverables/demo-video-script.md`](./deliverables/demo-video-script.md) for the recording script.

---

## Setup

```bash
git clone https://github.com/jdijols/supertutors.git
cd supertutors

# Install dependencies
npm install

# Set up environment (ElevenLabs voice API)
vercel env pull .env.local    # requires Vercel CLI + project access
# or manually: ELEVENLABS_API_KEY=... ELEVENLABS_VOICE_ID=...

# Start dev server
npm run dev     # Vite at localhost:5173
# `/api/voice` (name MP3 stitching) is served locally via the
# `devVoiceApi` Vite plugin in vite.config.ts — no `vercel dev` needed.

# Run tests
npm test           # Vitest unit tests
npm run test:run   # CI-friendly (no watch)
npm run test:e2e   # Playwright e2e (auto-starts dev server)
```

---

## Project Brief

Build a single, self-contained math lesson on **fraction equivalence (1/2 = 2/4)** for a Grade 3 student, runnable in a browser on iPad. Demo by Friday noon, 2026-05-22.

- **Concept:** Fraction equivalence
- **Audience:** Grade 3, ~9 years old
- **Form factor:** iPad-first web app
- **Architecture:** Pure scripted (deterministic state machine), no LLM

## World

- **Platform:** SuperTutors — a collection of subject-specific AI tutors; this ships the first one
- **Tutor:** Freddy Fractions — character vibe: **Super Mario meets Jersey Shore** — warm, lovable Italian-American chef energy
- **Setting:** SuperSlice Pizza — Freddy's pizza shop
- **Manipulative:** Sicilian-style (square) pizza pieces, sliced with a pizza-cutter wheel

## Lesson Flow

The default `/lesson` route runs a single bookended arc — **Onboarding → Exploration → Scripted Lesson → Win** — narrated entirely by Freddy:

1. **Onboarding (~15s)** — Freddy greets the kid, asks their name, and replies with the kid's name spoken in Freddy's voice (ElevenLabs).
2. **Exploration Tour (~25s)** — a guided "this is the counter, the slicer, the oven, the delivery box" walkthrough with each UI element pulsing as it's introduced. Ends with free play and a "tap me when you're ready" cue.
3. **Share the Pizza Lesson (~90s)** — the scripted core, modeled on the Synthesis "Share the Cookies" lesson. Freddy poses a real-world fairness problem ("two hungry kids, one pizza, gotta split it fair"), the student slices to halves, then to quarters, then drags pieces together to discover that **1/2 = 2/4** — the AHA moment. Branches for wrong slices, stuck states, and re-prompts keep every kid on the rails.
4. **Win (~10s)** — confetti, a Bellissimo, and the equivalence locked in.

Throughout, Freddy is the only narrator. State transitions are deterministic XState — no LLM, no latency, no hallucinations. Every line is pre-rendered ElevenLabs audio in `/public/audio/`, with the `{{NAME}}` slot stitched at runtime via `/api/voice` so the kid hears their own name spoken in Freddy's voice.

## Technical decisions

| Decision | Choice | Why |
|---|---|---|
| State machine | XState v5 | Deterministic, serializable, inspectable via Stately. No LLM = no hallucinations. |
| Voice | ElevenLabs + hybrid MP3 | Pre-generated segments for all static lines; runtime fetch only for the name-personalized segment. Fallback fires `DIALOGUE_DONE` immediately on failure. |
| Character art | Raster PNG via gpt-image-1 | SVG aesthetic couldn't match Pixar-style Freddy. |
| CV pipeline | MediaPipe Tasks Vision WASM | No server, no hardware, browser-native. GPU→CPU fallback. Lazy-loaded only when CV toggle is hit. |
| Cursor system | DOM-based ToolSprite | CSS cursor URLs silently failed in Chrome/macOS; DOM sprite follows pointer with zero render lag. |
| Proximity detection | Union-find + subset-sum | Detects equal partitions (AHA condition) in O(n·2^n) — fine for N≤8 pizza pieces. |
| Testing | Vitest + Playwright | Unit tests for all pure logic; Playwright e2e for Beat 6 state machine + sandbox mechanic. |
| Deployment | Vercel | Auto-deploy from main. Edge Function for `/api/voice` (ElevenLabs proxy). |

## Documents

- [PRD.md](./PRD.md) — full product requirements, system architecture, state diagrams
- [TASKS.md](./TASKS.md) — implementation tracking (source of truth for what's shipped)
- [deliverables/ipad-roadmap.md](./deliverables/ipad-roadmap.md) — v1.0 → v2.5 roadmap
- [deliverables/demo-video-script.md](./deliverables/demo-video-script.md) — recording script
- `References/` — project brief, design notes, CV brainlift (not part of product)

---

*Built 2026-05-19 → 2026-05-22. Autonomous overnight loops shipped the CV pipeline (OVN.1–10, 2026-05-21) and the Share-the-Pizza scripted lesson (2026-05-22).*
