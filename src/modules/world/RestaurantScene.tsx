import type { ReactNode } from "react";

const BACKGROUND_SRC = "/images/backgrounds/superslice-interior.png";

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
 *   1. BACKGROUND (z-0)  — full scene
 *   2. CHILDREN (z-10)   — Freddy, guests, table pieces — between bg + mask
 *   3. COUNTER MASK (z-20) — bottom half of the SAME bg image, layered as a
 *                            foreground "counter front" that visually cuts
 *                            characters at the counter line
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
      className="relative w-full h-full overflow-hidden bg-mozzarella-50"
    >
      {/* Layer 1 — background scene */}
      <img
        src={BACKGROUND_SRC}
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-0"
        draggable={false}
      />

      {/* Layer 2 — characters + objects standing BEHIND the counter */}
      {children}

      {/* Layer 3 — foreground "counter" mask: bottom half of the same bg image,
          layered above characters so the counter occludes their lower bodies.
          Inner <img> is rendered at 200% height with object-bottom so only
          the bottom half of the source (the counter portion) shows. */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-1/2 z-20 overflow-hidden pointer-events-none"
      >
        <img
          src={BACKGROUND_SRC}
          alt=""
          draggable={false}
          className="absolute bottom-0 left-0 w-full h-[200%] object-cover object-bottom"
        />
      </div>
    </div>
  );
}
