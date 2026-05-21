import { useCallback, useRef } from 'react';
import type { PinchState } from './gestures';

export type ViewportCoords = { x: number; y: number };

/**
 * Map webcam-normalized coords [0,1] → viewport pixels.
 * Webcam X is mirrored: normalized x=0 is the right edge of the mirrored feed.
 */
export function handCoordsToViewport(
  normalizedX: number,
  normalizedY: number,
  viewportWidth: number,
  viewportHeight: number,
): ViewportCoords {
  // Mirror X so gestures feel natural (move right hand right → cursor goes right)
  return {
    x: (1 - normalizedX) * viewportWidth,
    y: normalizedY * viewportHeight,
  };
}

function dispatchSyntheticPointer(
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  x: number,
  y: number,
) {
  const el = document.elementFromPoint(x, y);
  if (!el) return;
  const evt = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    pointerId: 99, // fixed ID so down/move/up are associated
    pointerType: 'hand',
    isPrimary: true,
  });
  el.dispatchEvent(evt);
}

/**
 * usePointerFromHand — converts per-frame PinchState into synthetic pointer events.
 *
 * Call update(pinchState) on every detection frame. The hook maintains the
 * previous pinch state to detect transitions (open→pinch = pointerdown,
 * pinch→open = pointerup). While pinching, fires pointermove on every frame.
 */
export function usePointerFromHand() {
  const wasPinchingRef = useRef(false);

  const update = useCallback((pinch: PinchState) => {
    const { isPinching, pinchCenter } = pinch;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const { x, y } = handCoordsToViewport(pinchCenter.x, pinchCenter.y, vw, vh);

    if (!wasPinchingRef.current && isPinching) {
      // Transition: open → pinch = pointerdown
      dispatchSyntheticPointer('pointerdown', x, y);
    } else if (wasPinchingRef.current && !isPinching) {
      // Transition: pinch → open = pointerup
      dispatchSyntheticPointer('pointerup', x, y);
    }

    if (isPinching) {
      // Continuous move while pinching
      dispatchSyntheticPointer('pointermove', x, y);
    }

    wasPinchingRef.current = isPinching;
  }, []);

  return { update };
}
