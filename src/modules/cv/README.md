# CV Physical Mode

Browser-native hand tracking using MediaPipe Tasks Vision. Converts webcam-detected hand landmarks into synthetic pointer events so the existing pizza slicer mechanics work hands-free — no server, no data leaving the device.

## Architecture

```
useHandLandmarks()        ← webcam → MediaPipe → 21 landmarks per hand
  └─ detectPinch()        ← pure gesture recognizer (thumb tip ↔ index tip)
       └─ usePointerFromHand()  ← maps pinch center → synthetic pointerdown/move/up
            └─ existing SandboxPreview slice + drag handlers (unchanged)
```

## How to enable

Append `?cv=true` to `/preview/sandbox`, or tap the "🖐️ Hands" button in ToolPicker.

## Privacy

All inference runs locally in WASM. No video frames or landmark data are transmitted anywhere.
