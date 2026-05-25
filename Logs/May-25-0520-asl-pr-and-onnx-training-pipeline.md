# ASL Demo Branch PR + ONNX Classifier Training Pipeline

**Date:** Monday, May 25, 2026 at 05:20 AM CDT
**Session focus:** Ship demo branch as PR, build and validate end-to-end ASL classifier training pipeline

---

## TL;DR

Opened the `feat/asl-pilot-platform-tuesday-demo` branch as PR #1 on GitHub. Created a new `feat/asl-classifier-training` branch and wrote the full Python training pipeline (WLASL → MediaPipe landmarks → sklearn MLP → ONNX). Ran the pipeline end-to-end: 2,495 real frames extracted from 69 WLASL clips, trained to **96% test accuracy**, exported a 229 KB `asl_classifier.onnx` ready for browser inference.

---

## Critical Decisions

- **Merge demo branch via PR, not direct merge** — cleaner history and keeps the GitHub PR record for the Tuesday demo context
- **Separate `feat/asl-classifier-training` branch off main** — keeps Python training artifacts (`.py`, ONNX, CSV) cleanly separate from the platform feature branch
- **MediaPipe Tasks API (0.10.x), not legacy `mp.solutions`** — `mp.solutions.hands` was removed in 0.10+; updated to `mp.tasks.vision.HandLandmarker`
- **Python 3.12 + DYLD_LIBRARY_PATH fix** — Homebrew Python 3.12 has a broken `pyexpat` due to system `libexpat` being too old; fixed by setting `DYLD_LIBRARY_PATH=/opt/homebrew/Cellar/expat/2.8.1/lib`
- **sklearn MLP + skl2onnx, not Keras/TensorFlow** — lighter dependencies, faster install, reliable ONNX export via `skl2onnx`; 63-feature input (21 landmarks × x,y,z normalized), 9-class output (8 signs + BACKGROUND)
- **Synthetic BACKGROUND class via random Gaussian noise** — no background video clips in WLASL; synthetic samples fill the "no sign" class so the model can output low confidence rather than forcing a wrong label
- **8× augmentation: noise + scale + rotation + translation + flip** — dataset only has 69 clips (~2,495 real frames); augmentation expands to 21,465 training samples

## Big Changes / Pivots

- **MediaPipe API rewrite mid-session** — initial `extract_landmarks.py` used `mp.solutions.hands` (legacy); had to rewrite to `mp.tasks.vision.HandLandmarker` after discovering the installed version (0.10.35) had dropped the legacy API
- **Label encoding added to train.py** — sklearn 1.8 + numpy 2.4 incompatibility with string labels + `early_stopping=True`; fixed by adding `LabelEncoder` to convert string → int before training
- **BACKGROUND class injected in train.py** — export initially failed with shape `(1, 8)` instead of expected `(1, 9)` because no BACKGROUND frames were extracted from WLASL; fixed by generating synthetic samples inside `train.py`

## Files Created / Modified

- [`ASL-ComputerVision/training/README.md`](ASL-ComputerVision/training/README.md) — pipeline documentation with quick-start, model architecture, browser integration instructions
- [`ASL-ComputerVision/training/requirements.txt`](ASL-ComputerVision/training/requirements.txt) — Python 3.12 deps: mediapipe, scikit-learn, skl2onnx, onnxruntime, pandas, tqdm
- [`ASL-ComputerVision/training/config.py`](ASL-ComputerVision/training/config.py) — shared constants: TARGET_SIGNS (8 signs + WLASL folder names), paths, hyperparameters
- [`ASL-ComputerVision/training/augment.py`](ASL-ComputerVision/training/augment.py) — landmark-space augmentation helpers (noise, scale, rotation, translation, flip)
- [`ASL-ComputerVision/training/extract_landmarks.py`](ASL-ComputerVision/training/extract_landmarks.py) — WLASL mp4 clips → normalized 63-float CSV via MediaPipe Tasks API; downloads `hand_landmarker.task` model on first run
- [`ASL-ComputerVision/training/train.py`](ASL-ComputerVision/training/train.py) — CSV → sklearn Pipeline (StandardScaler + MLPClassifier), LabelEncoder, synthetic BACKGROUND, augmentation, metrics output
- [`ASL-ComputerVision/training/export_onnx.py`](ASL-ComputerVision/training/export_onnx.py) — sklearn → ONNX (opset 17) via skl2onnx, onnxruntime validation, writes to `public/lessons/asl/model/`
- [`ASL-ComputerVision/training/run_pipeline.sh`](ASL-ComputerVision/training/run_pipeline.sh) — orchestrates all three steps with Python 3.12 detection and libexpat fix
- [`ASL-ComputerVision/training/python312`](ASL-ComputerVision/training/python312) — wrapper script that sets DYLD_LIBRARY_PATH before invoking `/opt/homebrew/bin/python3.12`
- [`ASL-ComputerVision/training/OnnxSignRecognizer.ts.draft`](ASL-ComputerVision/training/OnnxSignRecognizer.ts.draft) — TypeScript browser recognizer (copy to `src/lessons/asl/practice/OnnxSignRecognizer.ts` after demo branch merges)
- [`ASL-ComputerVision/training/.gitignore`](ASL-ComputerVision/training/.gitignore) — ignores `data/`, `.venv/`, `__pycache__/`
- [`public/lessons/asl/model/label_map.json`](public/lessons/asl/model/label_map.json) — committed label map (labels array + background_idx + feature_dim)
- [`public/lessons/asl/model/.gitignore`](public/lessons/asl/model/.gitignore) — ignores `*.onnx` binary (generated, not committed)

---

## Action Timeline

1. Verified branch `feat/asl-pilot-platform-tuesday-demo` was clean (no uncommitted changes, 11 commits ahead of main)
2. Pushed branch to origin, opened PR #1: https://github.com/jdijols/supertutors/pull/1
3. Created `feat/asl-classifier-training` off main
4. Checked WLASL dataset — confirmed 69 clips across 8 target signs (4–14 clips per sign) at `ASL-ComputerVision/References/WLASL-dataset/SL/`
5. Confirmed target signs from `vocab.ts` on feature branch: HELLO, THANK YOU, YES, NO, PLEASE, SORRY, HELP, FRIEND
6. Attempted `brew install python@3.11` — failed (Tier 3 config on Apple Silicon)
7. Installed Python 3.12 via Homebrew; discovered `pyexpat` broken due to system libexpat mismatch
8. Installed `expat` via Homebrew, created `python312` wrapper with `DYLD_LIBRARY_PATH` fix
9. Created `.venv` and installed all ML dependencies (mediapipe 0.10.35, scikit-learn 1.8, skl2onnx, onnxruntime, etc.)
10. Wrote `config.py`, `augment.py`, `extract_landmarks.py`, `train.py`, `export_onnx.py`, `run_pipeline.sh`, `OnnxSignRecognizer.ts.draft`
11. Smoke test (1 clip/sign, 5fps) — caught and fixed: `mp.solutions` removed → rewrote to Tasks API; `min_hand_presence_score` param not available → removed
12. Smoke test passed: 70 frames extracted, model trained to 72.7% (expected on 1-clip data)
13. Fixed label encoding TypeError (sklearn 1.8 + numpy 2.4 string label incompatibility)
14. Fixed export shape mismatch (8 vs 9 classes) — added synthetic BACKGROUND samples in `train.py`
15. Full pipeline verified smoke-to-ONNX with 9 correct output classes
16. Committed training pipeline to `feat/asl-classifier-training`
17. Ran full corpus extraction: 2,495 frames from all 69 clips (15fps sample rate)
18. Trained full model: 21,465 augmented samples → **96% test accuracy** in 500 iterations
19. Exported production `asl_classifier.onnx` (229 KB, opset 17, validated via onnxruntime)
20. Pushed `feat/asl-classifier-training` to origin

---

## Open Threads / Next Steps

- **Merge demo branch PR** — PR #1 is open; merge to main when ready for the Tuesday demo
- **Wire OnnxSignRecognizer into lesson** — after PR #1 merges:
  1. Copy `OnnxSignRecognizer.ts.draft` → `src/lessons/asl/practice/OnnxSignRecognizer.ts`
  2. Replace `MockSignRecognizer` in `usePracticeLoop.ts`
  3. Add `onnxruntime-web` to `package.json`
- **Reference videos for 8 signs** — `public/lessons/asl/videos/HELLO.webm` etc. referenced in `vocab.ts` but not yet present; record or source these before demo
- **ONNX model not committed** — intentionally gitignored (229 KB binary). For deployment, either commit it or serve from a CDN. For local dev the `run_pipeline.sh` regenerates it
- **Design loop** — originally planned for this session; deferred. Run `/design-review` on the live ASL practice screen after demo branch merges
- **Quick-win backlog** (from design audit, not blocking demo):
  - Empty state for activity feed with visual pointer to ASL card
  - Loading skeleton for mastery/progress on initial load
  - PassBeat `prefers-reduced-motion` fallback
  - "Continue practicing" button should pick most-recent lesson, not hardcoded `/lessons/asl`
- **HELLO has only 4 WLASL clips** (vs HELP's 14) — if HELLO recognition is weak in testing, can source additional clips or adjust augmentation multiplier in `config.py`
