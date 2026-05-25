# ASL ComputerVision

> **Workstream #3 — long-term lesson.** American Sign Language tutoring with real-time hand tracking. Sage (the tutor) sees the learner's signs via webcam and guides them through formation, recognition, and conversational practice.

**Status:** Research + scoping. Not yet a built lesson. Currently rendered on the SuperTutors landing page as a `ComingSoonMount` card.

## What's in this folder

| File / dir | What |
|---|---|
| [`References/`](./References/) | Research materials: CV-in-education brainlift, computer vision foundations |

## Why this lesson

ASL is a natural extension of the CV primitives already shipped for Freddy Fractions (MediaPipe Hands → 21 landmarks/30fps → pinch + position recognition). Where Freddy uses hand tracking as a manipulative interaction (pinch to slice), ASL uses it for sign recognition — same primitives, different output layer.

The platform's `CvCameraHandle` contract was designed so a lesson declares `requires: { camera: true }` and receives the camera handle via `props.platform.cv`. ASL will be the second consumer of that abstraction.

## Where the (stub) code lives

- **Code:** [`src/lessons/asl/`](../src/lessons/asl/) — `Mount.tsx` (ComingSoonMount), `index.ts` (LessonModule registration)
- **Registered in:** [`src/platform/registry.ts`](../src/platform/registry.ts)
- **Shared CV primitives** (already shipped): [`src/platform/cv/`](../src/platform/cv/) — `HandTracker`, `PinchRecognizer`, `usePointerFromHand`

## Heritage

Originally a standalone repo at github.com/jdijols/asl-computervision and labs.gauntletai.com/jasondijols/asl-computervision. Absorbed into the SuperTutors monorepo so all three workstreams live in one place. The remote repos remain as historical archives.
