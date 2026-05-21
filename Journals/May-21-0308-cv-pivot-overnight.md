# 2026-05-21 03:08 CDT — Pivot: CV Physical Mode Overnight

## TL;DR
Hybrid pivot for the Week 4 Synthesis clone. **Keep** the polished SuperSlice fractions lesson (5 days of work, near-shippable). **Add** a CV "physical mode" using MediaPipe Hands in the browser so the kid can slice pizzas with hand gestures via webcam. Ship by noon CDT 2026-05-21.

## Why this lesson, why this shape
- **Constraint:** ~9 hours, autonomous overnight loop, ship by noon.
- **Long-term goal:** job offer at Superbuilders (https://jobs.superbuilders.dev/jobs/afeea566-d947-49e4-8c18-947a0e43cd15). Tuesday interview is on a separate project — this Synthesis clone lives on the portfolio.
- **Audience for the portfolio:** Patrick Skinner (Hiring/GM, wrote `References/Education-via-Computer-Vision.md`, co-built BEMO at playbemo.com).
- **Implication:** the differentiator that nudges Patrick's mental model is alignment with HIS thesis — CV-driven manipulatives in education, physical-digital fusion, BEMO/OSMO.
- **Therefore:** Synthesis clone with a "slice with your hands" toggle beats Synthesis clone without one. Two artifacts on the portfolio when he clicks: a finished fractions tutor AND a CV-native interaction in microcosm.

## Why hybrid, not full pivot
- 10h autonomous from-scratch CV = high variance. Wake-up risk: broken everything.
- Hybrid keeps the **floor** (working SuperSlice — shippable) and adds the **ceiling** (CV demo — differentiated).
- Even if CV breaks, SuperSlice ships polished.
- Sunk cost is real — 12 planning rounds + 5 days of execution already in.

## What we're explicitly NOT doing
- Not rewriting tutorMachine, dialogue.json, or any of the audio pipeline.
- Not retraining anything. MediaPipe ships with pre-trained hand-landmark models.
- Not adding server-side anything. CV runs entirely on the device.
- Not gating SuperSlice on CV. Cursor mode remains the default everywhere.
- Not throwing away Beat 6 (AHA) demo readiness — that's still the hero.

## Stack
- **MediaPipe Tasks Vision** — `@mediapipe/tasks-vision`, browser-native, WASM-backed, ~21 hand landmarks at ~30fps
- **No new infra:** runs entirely on device. No webcam frames leave the browser.
- **Reuses existing contract:** CV layer converts hand landmarks → synthetic pointer events → existing `PizzaPiece` + `SLICED` handlers. Zero changes to `tutorMachine` or the proximity logic.

## Gesture vocab v1 (lowest-friction)
- **Open hand** → pointer follows index fingertip (mapped + mirrored to viewport)
- **Pinch (thumb tip ↔ index tip distance < threshold, normalized by palm width)** → mouse-down equivalent; drag begins
- **Pinch release** → mouse-up; gesture completes
- Slicing under cutter mode: pinch + drag across a piece → SLICED on release
- Moving under glove mode: pinch + drag piece → move

## Invariants (loop MUST respect)
- **Ship-ready always:** every commit must leave `main` deployable. If a commit can't pass `npm run build`, fix-forward in the same task or revert before moving on.
- **One concern per commit:** task `OVN.N` produces exactly one commit titled `[OVN.N] {what shipped}`.
- **No new deps without a dedicated commit:** any `npm install` is its own commit so it can be reverted cleanly.
- **Soft fallback gate at 07:00 CDT (4h from start):** if `OVN.2` (HandTracker) or `OVN.3` (pinch recognizer) are still red, trigger `OVN.11` — abandon CV, switch to polishing SuperSlice for the noon demo.
- **Hard stop at 11:00 CDT (8h from start):** stop regardless of state. Write a handoff journal so Jason can pick up the demo prep in the remaining hour.
- **Permission posture:** session is running under `--dangerously-skip-permissions` (user-authorized). Use it to install deps, edit files, and commit without prompts. Do NOT run destructive ops (rm -rf, force-push, reset --hard) without an explicit task asking for it.

## Risks + pre-mitigations
| Risk | Mitigation |
|---|---|
| MediaPipe WASM load failure | Wrap in try/catch with clean fallback to cursor mode. CV mode is opt-in via a toggle, not a default. |
| Permission denial / no webcam | `getUserMedia` rejection handled by reverting to cursor mode + showing a one-time inline note. |
| Latency / jitter making slicing unpleasant | Hysteresis on pinch threshold (0.7 enter, 0.4 exit), exponential smoothing on coords (alpha ~0.4), debounced gesture commit. |
| Webcam on iPad Safari | iPad Safari supports `getUserMedia` and WASM. Test on real device before noon. If it fails on iPad, ship as desktop-only demo with note in README. |
| CV core takes longer than 4h | Hard fallback at OVN.11 — switch to polish mode. |
| Vercel build breaks due to MediaPipe bundling | Mark MediaPipe as a dynamic import; lazy-load only when CV mode toggle is hit. Verify build before committing OVN.1. |

## Demo handoff (what Jason wakes up to)
- `README.md` has a "🎥 CV mode" section near the top
- `/preview/sandbox?cv=true` loads with webcam permission prompt → working hand-tracked slicing
- Vercel preview URL deployed and verified (curl smoke against the deployed URL)
- One commit per completed `OVN.N` task — easy to scan what happened overnight
- Handoff journal at `Journals/May-21-{time}-overnight-handoff.md` written at stop time, summarizing: what shipped, what blocked, current deployable URL, what to do in the last hour before noon.

## Pointers
- Tasks: `TASKS.md` → "OVERNIGHT — 2026-05-21" section
- Brainlift: `References/Education-via-Computer-Vision.md`
- BEMO: https://playbemo.com/
- MediaPipe Hands docs: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js
- Superbuilders job: https://jobs.superbuilders.dev/jobs/afeea566-d947-49e4-8c18-947a0e43cd15
