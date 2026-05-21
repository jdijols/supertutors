# CV Physical Mode

Browser-native hand tracking using MediaPipe Tasks Vision. Converts webcam-detected hand landmarks into synthetic pointer events so the existing pizza slicer mechanics work hands-free — no server, no data leaving the device.

## Architecture

```
useHandLandmarks()        ← webcam → MediaPipe → 21 landmarks per hand
  └─ detectPinch()        ← pure gesture recognizer (thumb tip ↔ index tip)
       └─ usePointerFromHand()  ← maps pinch center → synthetic pointerdown/move/up
            └─ existing LessonTable slice + drag handlers (unchanged)
```

## How to enable

Append `?cv=true` to `/lesson`, or tap the "🖐️ Hands" button in ToolPicker.
In dev: `?skip=true&cv=true` drops you straight into the sandbox with CV on.

## Privacy

All inference runs locally in WASM. No video frames or landmark data are transmitted anywhere.
