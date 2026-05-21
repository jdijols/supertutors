// CV physical mode — MediaPipe Hands-based gesture tracking.
// All processing runs on-device; no webcam frames leave the browser.
// This module is lazy-loaded only when CV mode is toggled.

export { HandTracker, useHandLandmarks } from './HandTracker';
export type { HandResult } from './HandTracker';

export { detectPinch, pinchStrength, PinchRecognizer } from './gestures';
export type { Landmark, PinchState } from './gestures';

export { usePointerFromHand, handCoordsToViewport } from './usePointerFromHand';
export type { ViewportCoords } from './usePointerFromHand';
