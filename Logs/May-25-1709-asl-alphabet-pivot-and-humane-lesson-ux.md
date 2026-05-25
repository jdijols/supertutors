# ASL Alphabet Pivot, Humane Lesson UX, and Production Cleanup

**Date:** Monday, May 25, 2026 at 05:09 PM CDT
**Session focus:** Pivot ASL recognition from word signs to the 26-letter alphabet, build a humane lesson surface around it, capture user corrections to Supabase, and consolidate everything onto a clean main branch

---

## TL;DR

Pivoted the ASL lesson from unreliable word-sign recognition to a 99%-accurate alphabet classifier (sequence model trained on Kaggle ASL Alphabet). Rebuilt the practice surface around a grid-first picker with skip-anywhere navigation, confusion-pair drills, and a "Save my example" button that writes user corrections to a new Supabase `training_samples` table for future retraining. Merged six feature branches into main and pushed; production is clean.

---

## Critical Decisions

- **Pivot from word signs to the 26-letter alphabet** — Word signs (HELLO, PLEASE, etc.) depend on face/body context that hand-only MediaPipe landmarks can't supply; alphabet handshapes are precisely what our pipeline can recognize. User: "I think the alphabet would be much easier."
- **Use the Kaggle ASL Alphabet dataset (87K images, ~1.1 GB)** — Most variety, dataset already curated, kaggle CLI + token integration for fetching.
- **Sequence model + 1D-CNN + Transformer architecture (shrunk to dim=64)** — Ported from hoyso48's Kaggle ASL Signs 1st-place solution; ~200K params, 860 KB ONNX, fits browser inference budget.
- **126-feature input (63 position + 63 velocity)** — Adopted from the Kaggle winner's feature scheme; position and velocity-as-frame-deltas, no wrist normalization (keeps location info).
- **Grid as the lesson's default entry, not linear A→Z** — Eliminates the "stuck at letter N" trap; user can self-direct, mastery state visible per letter.
- **Tap the PromptCard to return to grid (always available)** — Replaces the 10-second-stuck-and-wait SkipPill. User: "I think better terminology would be 'Send me back'… that's how I kind of view the engagement: I'm looking at the grid, I select a letter, that letter goes up as a card right in the top center, and then when I click that same card, then it opens back the grid."
- **Word signs stay visible but non-tappable** — Pushback on user's instinct to make them practiceable; the alphabet model can't recognize them, so showing them as "Coming with face + pose tracking" telegraphs the roadmap without trapping the user.
- **"Save my example" framing, not "Train model"** — Honest expectation-setting: the data feeds future retraining batches, not in-browser weight updates. ONNX in the browser is frozen.
- **Per-session branching going forward** — Today's session saw multiple chats writing to the same files concurrently, causing apparent "reverts" that were actually concurrent overwrites. User: "I'm going to start closing out these chats and work primarily in future branches from now on so this doesn't happen going forward."

## Big Changes / Pivots

- **TRAINED_SIGNS** went from 8 word signs → 26 alphabet letters; words moved to a non-tappable catalog section
- **OnnxSeqSignRecognizer** rewritten to maintain a 32-frame ring buffer and run sequence inference (replaced the single-frame MLP recognizer)
- **PracticeScreen architecture** flipped: camera + view-switcher live in Mount.tsx; PracticeScreen, LetterGrid, SessionSummary are interchangeable overlays sharing the same camera
- **Skip mechanic** replaced entirely: 10-second-stuck-pill → always-available PromptCard-as-back-button
- **Design system pass** — every ASL component now uses platform `sb-*` tokens; only `basil-400` retained as the small semantic ✓ glyph (matching ActivityFeed's convention)

## Files Created / Modified

### Training pipeline
- [`ASL-ComputerVision/training/config.py`](ASL-ComputerVision/training/config.py) — TARGET_LETTERS A–Z, LABELS includes BACKGROUND (27 classes), FEATURE_DIM = 126
- [`ASL-ComputerVision/training/extract_alphabet.py`](ASL-ComputerVision/training/extract_alphabet.py) — NEW; still-image landmark extraction with tile-to-32-frames + zero velocity
- [`ASL-ComputerVision/training/extract_sequences.py`](ASL-ComputerVision/training/extract_sequences.py) — existing WLASL video extractor (reused helpers)
- [`ASL-ComputerVision/training/model_seq.py`](ASL-ComputerVision/training/model_seq.py) — PyTorch port of hoyso48's architecture
- [`ASL-ComputerVision/training/augment_seq.py`](ASL-ComputerVision/training/augment_seq.py) — temporal resample, spatial affine, masking
- [`ASL-ComputerVision/training/train_seq.py`](ASL-ComputerVision/training/train_seq.py) — full training loop with adaptive LR + LateDropout
- [`ASL-ComputerVision/training/export_onnx_seq.py`](ASL-ComputerVision/training/export_onnx_seq.py) — torch → ONNX opset 17 + onnxruntime validation
- [`ASL-ComputerVision/training/test_config.py`](ASL-ComputerVision/training/test_config.py) — NEW; sanity test for label structure
- [`ASL-ComputerVision/training/test_extract_alphabet.py`](ASL-ComputerVision/training/test_extract_alphabet.py) — NEW; mocked-detector smoke test

### Models / outputs
- [`public/lessons/asl/model/asl_classifier.onnx`](public/lessons/asl/model/asl_classifier.onnx) — 860 KB, [1, 32, 126] → [1, 27]
- [`public/lessons/asl/model/label_map.json`](public/lessons/asl/model/label_map.json) — 26 letters + BACKGROUND

### ASL lesson surface
- [`src/lessons/asl/vocab.ts`](src/lessons/asl/vocab.ts) — TRAINED_SIGNS = 26 letters; word signs in CATALOG_SIGNS
- [`src/lessons/asl/vocab.test.ts`](src/lessons/asl/vocab.test.ts) — 12 tests for the letter-only catalog
- [`src/lessons/asl/Mount.tsx`](src/lessons/asl/Mount.tsx) — view switcher for grid/practice/summary; camera always mounted
- [`src/lessons/asl/store/aslStore.ts`](src/lessons/asl/store/aslStore.ts) — `viewMode`, `currentSignId`, `outcomes`, `drill`, `observedSignId`
- [`src/lessons/asl/practice/LetterGrid.tsx`](src/lessons/asl/practice/LetterGrid.tsx) — NEW; 26-tile grid + tricky-pair drills + word-signs "coming soon" row
- [`src/lessons/asl/practice/PracticeScreen.tsx`](src/lessons/asl/practice/PracticeScreen.tsx) — overlays on the shared camera; drops the wrapping `<div>` and its own video element
- [`src/lessons/asl/practice/PromptCard.tsx`](src/lessons/asl/practice/PromptCard.tsx) — becomes a button when `onBack` is set; tap-to-go-back affordance
- [`src/lessons/asl/practice/HintCard.tsx`](src/lessons/asl/practice/HintCard.tsx) — HUD-aware comparison framing + "Save my example" button
- [`src/lessons/asl/practice/SessionSummary.tsx`](src/lessons/asl/practice/SessionSummary.tsx) — NEW; end-of-session overlay with mastered/tried/untouched counts
- [`src/lessons/asl/practice/OnnxSeqSignRecognizer.ts`](src/lessons/asl/practice/OnnxSeqSignRecognizer.ts) — 32-frame buffer, async inference, adaptive PASS_THRESHOLD ramp, `getCurrentBuffer()` for training capture
- [`src/lessons/asl/practice/usePracticeLoop.ts`](src/lessons/asl/practice/usePracticeLoop.ts) — per-letter loop, `handleBackToGrid`, `handleSaveExample`, drill orchestration
- [`src/lessons/asl/practice/HandMeshOverlay.tsx`](src/lessons/asl/practice/HandMeshOverlay.tsx) — NEW (earlier); draws 21-point hand skeleton with object-cover compensation
- [`src/lessons/asl/practice/RecognitionHUD.tsx`](src/lessons/asl/practice/RecognitionHUD.tsx) — NEW (earlier); top-5 prediction overlay, toggle with `D`
- [`src/lessons/asl/practice/ReferenceVideoModal.tsx`](src/lessons/asl/practice/ReferenceVideoModal.tsx) — DELETED; no source videos available
- [`src/lessons/asl/practice/SkipPill.tsx`](src/lessons/asl/practice/SkipPill.tsx) — DELETED; PromptCard back-tap replaces it

### Platform progress + Supabase
- [`src/platform/progress/types.ts`](src/platform/progress/types.ts) — added `SaveTrainingSampleInput` + `saveTrainingSample` to `ProgressHandle`
- [`src/platform/progress/SupabaseProgressClient.ts`](src/platform/progress/SupabaseProgressClient.ts) — writes to `training_samples` table
- [`src/platform/progress/InMemoryProgressClient.ts`](src/platform/progress/InMemoryProgressClient.ts) — no-op implementation
- [`supabase/migrations/20260525000002_training_samples.sql`](supabase/migrations/20260525000002_training_samples.sql) — NEW; user-correction storage with RLS

### Build / config
- [`package.json`](package.json) — added `onnxruntime-web`; later removed `setup:ort` + `postinstall` after switching to CDN
- [`.gitignore`](.gitignore) — added `ASL-ComputerVision/References/asl-alphabet/`, ORT WASM paths, training data folder
- [`tailwind.config.*`](tailwind.config.js) — confirmed `basil-400`/`basil-500` are the only basil shades; `basil-700` is undefined (bug fix elsewhere)

---

## Important User Prompts

> "i will test soon but also, Here is a deeper look into that resource i sent last message. maybe we can use part of or be inspired by his winning solution?"

**Why it mattered:** Triggered the deep dive into hoyso48's Kaggle ASL Signs 1st-place solution. The agent's findings (118 landmarks + velocity + acceleration, Conv1D + Transformer, AWP/SWA, OneCycleLR) directly informed the sequence-model architecture we ported.

> "i say we go with option 3 and if we need to copy his work, that is fine. it is public facing"

**Why it mattered:** Authorized the full sequence-model port from the public Kaggle solution. Without this we'd have been stuck on the single-frame MLP that couldn't handle motion signs.

> "I'm not sure you're right here, but let's go ahead and do option B then A."

**Why it mattered:** User pushback on premature theorizing. The HUD that B introduced revealed the actual bug (model wasn't loaded — ORT couldn't fetch the .mjs glue files) instead of the assumed normalization issue.

> "i'm trying to sign hello but get no pass, fail, or hint"

**Why it mattered:** Forced a real diagnosis instead of more theory. Led to the HUD instrumentation that surfaced the ORT loading failure.

> "I definitely want the grid pivot that we just worked on back. Is it possible to recover that file? I think what's happening is we're not using any branching, which is causing the conflict."

**Why it mattered:** Identified the root cause of the apparent "reverts" — concurrent chats writing the same files. Set the going-forward policy of per-session branching.

> "On the button that opens up the grid after they've already started signing different letters that says 'Skip for now'. I think better terminology would be 'Send me back'… that's how I kind of view the engagement: I'm looking at the grid, I select a letter, that letter goes up as a card right in the top center, and then when I click that same card, then it opens back the grid."

**Why it mattered:** Drove the entire "PromptCard as back affordance + delete SkipPill" pattern. Replaced a 10-second wait gate with a one-tap always-available exit.

> "Something else that I would consider is that right now, when I'm signing the letter C, it's telling me I'm signing the letter D… have a button here that says 'Train model' or something to that effect. That way my input helps improve the model, so it's not just a static one-time training, but the data that users are giving to the application is constantly improving."

**Why it mattered:** Surfaced the "Save my example" feature — Supabase capture of landmark sequences + correct labels for future retraining. Drove the new migration, ProgressHandle method, recognizer buffer-export, and HintCard button.

> "Ok, let's go ahead and make sure that we stage, commit, and push everything to production, and that we merge any feature branches back to main."

**Why it mattered:** Triggered the final consolidation — merging feat/v3-data-model-foundation into main, resolving 5 conflicts (taking the newer feat-side versions), pushing to both remotes, deleting 6 local + 5 remote branches.

---

## Action Timeline

1. **Designed and ran the alphabet pivot plan** — config.py + extract_alphabet.py + tests, downloaded Kaggle dataset via CLI, extracted 57,727 landmark sequences (M and N lowest at ~1,000 samples due to MediaPipe tucked-thumb detection issues)
2. **Trained the sequence model on CPU** — 60 epochs, LateDropout at 30%, OneCycleLR cosine, best val 99.0% accuracy
3. **Exported the 860 KB ONNX model** with onnxruntime validation
4. **Pivoted vocab.ts to 26 letters** (multiple iterations with concurrent reverts)
5. **Built LetterGrid + SessionSummary + drill mechanics**
6. **Built the SkipPill, then deleted it** when user asked for PromptCard-as-back-button instead
7. **First design-system alignment pass** — caught `basil-700` undefined bug, replaced rounded-full pills with rounded-2xl chrome cards
8. **Second design-system alignment pass after concurrent reverts** — kept the work clean despite multiple files getting rolled back and rewritten by parallel sessions
9. **Added "Save my example"** — new Supabase migration, ProgressHandle extension, recognizer.getCurrentBuffer(), HintCard button with state machine
10. **Final git cleanup** — pushed feat/v3-data-model-foundation, merged into main, resolved 5 conflicts (took feat-side), pushed main to both remotes (github + gauntletai), deleted 6 local + 5 remote merged branches

---

## Open Threads / Next Steps

- **Run the alphabet model in production for the first time** — Supabase migration is applied, model is on main, but no end-to-end test of the "Save my example" write to `training_samples` has happened in production yet
- **Future retraining batch** — the `training_samples` table will accumulate user corrections; need a Python job that periodically reads from Supabase, merges with the Kaggle base, and retrains
- **Reference videos per letter** — still nothing for the alphabet; phonology card is the substitute. Adding videos would meaningfully improve onboarding (Phase-2 work)
- **Word-sign recognition** — requires MediaPipe Holistic (face + pose landmarks) to actually work. The "coming soon" row in LetterGrid telegraphs this; the backend implementation is its own project
- **M and N accuracy** — tucked-thumb handshapes have lower MediaPipe detection rates and the lowest training-set counts (995, 1200). May misfire more in real demos; user corrections via "Save my example" will help over time
- **J and Z motion letters** — trained on static frames only (Kaggle dataset is still images), so they're classified by end-pose handshape rather than motion. Same Phase-2 remedy: capture supplementary video

---

## Notes for Next Session

- All four UX rounds are on production: grid pivot, design-system alignment, round 2 (bigger glyphs / back affordance / coming-soon words / training capture), and the consolidation merge
- Git is clean: `main` only, both remotes up to date with `8b43e8a73 Merge feat/v3-data-model-foundation into main`
- 423 / 423 tests passing, TypeScript clean (acutis duplicate-function pre-existing issue is unrelated)
- New collaboration practice: per-session feature branches going forward
