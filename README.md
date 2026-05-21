# SuperTutors — Freddy Fractions

> A conversational AI math tutor that teaches fraction equivalence to 9-year-olds through a Sicilian-pizza manipulative. Built for the Week 4 Gauntlet challenger project (clone Synthesis Tutor).

**Live:** [supertutors.vercel.app](https://supertutors.vercel.app) — Beat 6 (AHA) + full sandbox mechanics + CV physical mode

---

## 🎥 CV mode (BEMO-style physical interaction)

Slice pizzas with your hands. SuperSlice ships an opt-in "physical mode" powered by [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js) running entirely in the browser via WebAssembly. No installs. No server. No video data leaves your device — all hand-landmark inference runs locally.

Inspired by [Patrick Skinner's work on BEMO](https://playbemo.com/) — the thesis that CV-driven physical manipulatives make math learning qualitatively different from pointing at a screen.

**Try it:**

- [CV sandbox](https://supertutors.vercel.app/preview/sandbox?cv=true) — slice pizzas by pinching + dragging in front of your webcam
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
| [/preview/sandbox](https://supertutors.vercel.app/preview/sandbox) | Full pizza mechanic (slice + drag + proximity) |
| [/preview/sandbox?cv=true](https://supertutors.vercel.app/preview/sandbox?cv=true) | CV physical mode |
| [/preview/cv](https://supertutors.vercel.app/preview/cv) | Hand landmark debug overlay |
| [/lesson?beat=aha&demo=true](https://supertutors.vercel.app/lesson?beat=aha&demo=true) | Beat 6 (AHA) with dev controls |

**Demo mode shortcuts** (append `?demo=true` to any URL):

| Key | Destination |
|---|---|
| `0` | CV preview (`/preview/cv`) |
| `1` | Landing |
| `2` | Sandbox |
| `6` | Beat 6 (AHA) — the hero demo moment |
| `C` | CV sandbox (`?cv=true`) |
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
# Note: /api/voice (name stitching) needs `vercel dev` not `npm run dev`

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

*Built 2026-05-19 → 2026-05-22. Autonomous overnight loop shipped the CV pipeline (OVN.1–10) in ~8 hours.*
