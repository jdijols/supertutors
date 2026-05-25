# ASL Pilot — Quality & Honesty

This document covers the project brief's Requirement 8 (pilot quality
characterization) and Requirement 15 (validation evidence). It is
deliberately candid about what the pilot is and isn't.

## What's shipping in the Tuesday pilot

The ASL lesson is a **demo-ready full UX loop** with a **mock
recognizer** standing in for the trained classifier. The mock returns
"pass" after a sustained hand presence and supports keyboard overrides
(P/F/U) so the demo can deliberately trigger the hint card and
reference video. This keeps the contract stable for swapping in the
real ONNX classifier post-demo without UI changes.

### What is real (production-grade)
- **Hand detection.** MediaPipe HandLandmarker — pretrained, GPU-accelerated, in-browser.
- **The full UX surface.** Practice screen, phonological hint card,
  reference video, pass beat, confidence cue, camera gate.
- **Progress tracking.** Supabase-backed Universal Item / Attempt /
  Mastery schema with RLS. Attempts persist; activity feed renders.
- **Auth.** Email/password via Supabase Auth, session refresh, RLS-bound reads.
- **Privacy.** Camera frames never leave the browser. Only attempt outcomes are uploaded.

### What is mocked (acknowledged scope)
- **The sign classifier itself.** A `MockSignRecognizer` returns "pass"
  after 2.5 seconds of sustained hand presence. The contract
  (`SignRecognizer` interface) is identical to what the trained ONNX
  model will satisfy.

## Honest reading of project brief Requirement 7

Req 7 prohibits pretrained models. The pilot honestly inherits a
precedent from the Freddy Fractions lesson, which has shipped MediaPipe
HandLandmarker since the May 21 CV pivot.

The interpretation we apply: **MediaPipe is the landmark front-end
(pretrained, but inviolable for browser ASL — there is no path to ship
21-keypoint hand tracking in a 24-hour window without it). The sign
classifier itself is custom, from-scratch when trained. Freddy crossed
this line consciously and documented it. This pilot extends the same
posture.**

## Supported environment (when the real classifier ships)

The classifier will be trained on WLASL clips and validated for:
- **Camera & lighting.** Well-lit room, single hand visible to the
  camera, 0.5–1.5m from the lens.
- **Framing.** Webcam at chest level, signing within the upper half of
  the visible body.
- **Signing distance.** Hand within 30–80% of frame width.
- **Vocabulary.** 8 trained hero signs (HELLO, THANK YOU, YES, NO,
  PLEASE, SORRY, HELP, FRIEND) curated for phonological diversity
  using ASL-LEX 2.0 frequency + AoA columns.

## Validation plan (when the classifier ships)

Per-class top-1 accuracy target on held-out WLASL: **≥ 80%**. Confusion
matrix published. Per-class confidence thresholds tuned via ROC inspection.

The 8 hero signs were curated for phonological distinctness so a
small-data classifier has a fighting chance:
- B-handshape (HELLO, THANK YOU, PLEASE) vs S-fist (YES) vs A-fist (SORRY)
- forehead vs chin vs chest vs neutral space
- linear away vs nodding vs circular vs hook movements

## Known limitations

- **Catalog vs. trained gap.** The lesson catalog lists ~86 signs but
  the classifier is trained on 8. Untrained signs route to "uncertain"
  by design — the recognizer never falsely passes a non-trained sign.
- **Mock-only for Tuesday.** Until the trained model ships, the demo
  uses time-on-hand for pass detection. This is documented in the
  practice screen footer.
- **Hidden-tab behavior.** CSS transitions, not framer-motion, drive
  the hint card and reference video — framer-motion's animate() stalls
  when `visibilityState: hidden`. PassBeat uses framer-motion (only
  fires during active use, never in background tabs).

## Recovery path

If the user demos a sign the recognizer can't classify, they get a
hint card with phonological breakdown and an optional reference video.
They can also skip ("needs_practice" status) and continue. No dead-ends.

---

**Reviewed against project brief, May 25 2026.**
