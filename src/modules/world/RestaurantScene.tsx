import type { ReactNode } from "react";

const BACKGROUND_SRC = "/images/backgrounds/superslice-interior.png";
const COUNTER_SRC = "/images/backgrounds/superslice-counter.png";

/**
 * RestaurantScene — full-bleed backdrop for the SuperSlice Pizza world.
 *
 * Chef's POV behind the pizza counter (per design decision 2026-05-19):
 *   - Oven on the LEFT
 *   - Counter dominates the foreground
 *   - Guest area on the right
 *   - Freddy + guests stand BEHIND the counter (visually occluded waist-down)
 *
 * Three-layer composition for proper occlusion:
 *   1. BACKGROUND (z-0)  — full interior scene, anchored bottom so the
 *                          counter line in the source image always pins to
 *                          the viewport floor
 *   2. CHILDREN (z-10)   — Freddy, guests, table pieces — sit between bg
 *                          and the counter overlay; rendered full-body
 *   3. COUNTER OVERLAY (z-20) — dedicated `superslice-counter.png` (an exact
 *                               crop of the counter slab + plates + floor
 *                               sliver from the same source scene). Anchored
 *                               bottom + w-full so its plates and floor
 *                               edge align with the interior background
 *                               behind it. Naturally occludes Freddy's lower
 *                               half — no bottom-half-mask kludge.
 *
 * UI overlays that should appear ABOVE the counter (speech bubbles,
 * NameInputOverlay, NumberBar, ToolPicker) use z-30+ and are placed by
 * the consumer (LessonView), NOT as children of this component.
 */
export interface RestaurantSceneProps {
  children?: ReactNode;
}

export function RestaurantScene({ children }: RestaurantSceneProps) {
  return (
    <div
      data-testid="restaurant-scene"
      className="relative w-full h-full overflow-hidden bg-sb-surface"
    >
      {/* Layer 1 — background interior. object-bottom + object-cover keeps the
          counter line of the source pinned to the viewport bottom so the
          counter overlay (Layer 3) lines up regardless of viewport aspect. */}
      <img
        src={BACKGROUND_SRC}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-bottom z-0"
        draggable={false}
      />

      {/* Layer 2 — characters + objects standing BEHIND the counter */}
      {children}

      {/* Layer 3 — counter overlay. Exact crop of the counter from the same
          source scene (1536x484, the bottom 47.265% of the 1536x1024 interior).
          Sized to match the interior's `object-cover` scale at any aspect
          ratio via CSS max():
            - 31.51vw  = 484/1536, counter h as fraction of interior WIDTH
                         (kicks in when viewport aspect > 3:2, e.g. desktop —
                         interior fills width, crops vertically)
            - 47.27vh  = 484/1024, counter h as fraction of interior HEIGHT
                         (kicks in when viewport aspect < 3:2, e.g. iPad —
                         interior fills height, crops horizontally)
          max() picks the LARGER value, which is whichever axis is the
          constraining one for object-cover. Result: counter scale always
          matches interior scale, the plates + floor edge align perfectly
          across iPad Mini → 1440 desktop → ultra-wide. Centered horizontally
          so the horizontal crop (when any) matches the interior's. */}
      <img
        aria-hidden
        src={COUNTER_SRC}
        alt=""
        draggable={false}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[max(31.51vw,47.27vh)] w-auto max-w-none z-20 pointer-events-none select-none"
      />
    </div>
  );
}
