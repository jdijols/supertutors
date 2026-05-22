# Demo Video Script — SuperSlice / Freddy Fractions
**Runtime target: 3–5 minutes**
**Audience: Patrick Skinner + Superbuilders hiring team**

---

## Opening (0:00 – 0:30) — The thesis

> Spoken voiceover, or Jason speaking to camera.

"Education technology has a manipulation problem. Not in the bad sense — in the physical sense. The research is unambiguous: when kids use their hands to work with objects, learning sticks deeper. OSMO proved the market. BEMO proved the pipeline. But both require hardware.

What if you could do the same thing with just an iPad and a web browser?"

*Cut to browser tab opening `/lesson?skip=true&cv=true`*

---

## Part 1 (0:30 – 1:30) — The pizza manipulative

**Show:** `/lesson?skip=true` (skip onboarding, no CV yet)

> "Here's the core mechanic. Freddy's pizza shop. A whole Sicilian pizza. The kid picks up the cutter and slices it."

*Click the cutter tool. Click the pizza — it splits into halves.*

> "Freddy reacts to each milestone slice with a quick speech bubble — 'Boom — halves!' on the first cut, 'Quarters! Four equal pieces' on the second, 'Eighths! Look at all those slices' on the third. The bubbles use the same voice as the rest of the lesson, so Freddy is the only narrator."

*Continue slicing down to eighths.*

> "Then switch to the glove. Drag pieces together."

*Drag two quarter pieces next to each other. Proximity indicator appears: `≡`.*

> "That equals sign means the cluster admits an equal partition — 2/4 = 2/4. That's the AHA condition."

*Watch — the AHA animation fires automatically: screen flash, radial glow, equivalence mark locking in.*

> "The animation fires right here in the sandbox — same component as the lesson, same state trigger, zero extra code."

*Drag both halves back together.*

> "And when you put the whole pizza back together — Win confetti. The sandbox has a complete arc: explore, discover, celebrate."

---

## Part 2 (1:30 – 2:30) — The full scripted lesson

**Show:** Navigate to `/lesson` and go through the full flow, OR use `/lesson?lesson=scripted` to jump straight to the lesson.

> "The full lesson machine adds Freddy's voice and a scripted arc. After the exploration tour, Freddy poses a real-world fairness problem: two friends, one pizza, gotta split it fair."

*Enter name at onboarding, go through the 4-stage exploration tour, tap 'Start lesson'.*

> "The lesson is a local-state machine with 16 stages. Freddy waits for the kid to act, reacts to every slice milestone, branches for wrong moves, and delivers a stuck-state nudge after 30 seconds."

*Slice the pizza to halves. Hear Freddy react. Slice each half to quarters. Hear Freddy pivot to the comparison prompt.*

> "Now Freddy asks: drag two of those quarters right next to one half. Tell me what you notice."

*Drag two quarter pieces next to the half. Proximity indicator appears. AHA fires.*

> "There it is — the AHA moment. One half is the EXACT same size as two quarters. That's fraction equivalence. The same visual reveal, now properly choreographed in a scripted lesson."

*Win confetti plays.*

> "The state machine is deterministic — no LLM, no latency, no hallucinations. Every child gets the same choreographed aha moment, delivered in Freddy's voice via ElevenLabs."

---

## Part 3 (2:30 – 3:30) — CV physical mode

**Show:** Tab back to `/lesson?skip=true`. Click the 🖐️ Hands button.

> "But here's the thing Patrick cares about. What if the kid didn't need to click at all?"

*Privacy notice appears. Click 'Got it'.*

> "MediaPipe Hands running entirely in the browser. No server. No latency penalty. No video leaving the device. Twenty-one hand landmarks at 30fps via WebAssembly."

*Hold hand up to webcam. Landmarks appear.*

> "The orange dot tracks the index fingertip. When I pinch — thumb meets index finger — the gesture fires as a pointer event on whatever's under my hand."

*Pinch over the pizza. Slice appears.*

> "I just sliced a pizza with my hand. No hardware. No OSMO reflector. Just a browser and a webcam."

> "This is the thesis in Patrick's BEMO work: computer vision turns physical manipulation into digital learning events. Here it runs on any device with a camera — iPad, desktop, whatever."

---

## Part 4 (3:30 – 4:00) — Architecture pitch

**Show:** README in browser, or switch to code editor.

> "The architecture is deliberately layered. The CV module is completely decoupled from the lesson mechanics."

*Gesture at the layer diagram in README or cv/README.md*

```
useHandLandmarks()        ← webcam → MediaPipe → 21 landmarks
  └─ PinchRecognizer      ← hysteresis + exponential smoothing
       └─ usePointerFromHand  ← synthetic pointer events
            └─ existing slice + drag handlers  ← zero changes
```

> "Zero changes to the pizza slice logic. The CV layer just fires pointer events. Every piece of lesson logic that works with a mouse or touch also works with hands — automatically.

> "That's the separation I'd want in a production CV pipeline. The gesture vocab is pluggable. Pinch today, swipe tomorrow, two-hand gestures next quarter."

---

## Close (4:00 – 4:30) — What's next

> "The floor here is a polished, deployable fractions tutor with voice, animation, and a state machine. The ceiling is CV-native physical interaction in the browser.

> "This took 5 days. The CV layer shipped overnight as an autonomous loop. The stack is Vite + React + XState + MediaPipe — nothing exotic, all standard.

> "The question I want to explore with Superbuilders: what does the full BEMO-style pipeline look like at scale? What happens when you track not just hand position but the arc of a child's confusion — the hesitation, the wrong guess, the moment of realization?"

*End on the AHA animation playing one more time.*

---

## Recording notes

- Use `?demo=true` on any URL to enable keyboard shortcuts during recording
  - `0` → `/preview/cv` (hand tracking debug view)
  - `C` → `/lesson?skip=true&cv=true` (lesson + CV pre-armed — the hero demo)
  - `2` → `/lesson?skip=true` (skip onboarding into the manipulative — slice + AHA in-sandbox)
  - `6` → `/lesson?beat=aha` (AHA state machine vertical slice with voice)
  - `8` → `/lesson?beat=win` (Win confetti celebration moment)
- For CV section: have webcam permissions already granted (click through the privacy notice once before recording)
- If MediaPipe WASM loads slowly on first visit, do a warm-up load before recording and keep the tab open
- Audio is muted in the lesson view by default in local dev — use Vercel preview URL for sound, or toggle with the mute button top-right
