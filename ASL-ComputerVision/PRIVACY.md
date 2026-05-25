# ASL Lesson — Privacy

A clear walkthrough of where each kind of data lives, covering project
brief Requirement 13 (privacy).

## What stays on your device

**Camera frames.** Video from your webcam is processed entirely in
the browser. Frames never leave your device. They are not uploaded to
SuperTutors, not stored on disk, not sent to MediaPipe, not sent to
Supabase, not sent anywhere.

**Hand landmarks.** MediaPipe HandLandmarker runs in-browser via
WebAssembly. The 21 hand keypoints it produces stay in browser memory
and are passed to the (future) classifier directly. They are not
uploaded.

**Classifier inference.** The ONNX classifier (when shipped) runs
in-browser via ONNX Runtime Web (WebAssembly). Sign predictions stay
on-device.

## What gets uploaded

Only the **outcomes** of your practice attempts:
- Which sign you were practicing (e.g. `asl:HELLO`)
- Whether you got it (`pass` / `fail` / `uncertain` / `skip`)
- Whether you saw the hint or reference video
- Timestamps

These are plain-text rows in a Postgres database (Supabase). They are
tied to your user account, protected by row-level security so other
users cannot read them, and you can delete your account at any time
to remove them.

## What we do not collect

- No video.
- No audio.
- No hand landmark coordinates.
- No raw classifier confidences or feature vectors.
- No background environment information (no room captures, no faces).

## Account data

If you create an account:
- Email address (for sign-in)
- Optional display name
- Hashed password (never plaintext)
- Account creation timestamp

These are managed by Supabase Auth and follow standard auth-data practices.

## Camera permission

The browser will ask for camera permission the first time you open the
ASL lesson. You can revoke this at any time in browser settings — the
lesson will still load and show the "Camera access needed" screen
until you grant it again.

## Children's privacy

SuperTutors is designed for kids. We do not collect more than what's
listed above. We do not use the data for advertising, profiling, or
sale to third parties.

---

**For questions, contact: jasondijols@gmail.com**
