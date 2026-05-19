import type { ReactNode } from "react";

/**
 * RestaurantScene — full-bleed backdrop for the SuperSlice Pizza world.
 *
 * Chef's POV behind the pizza counter (per design decision 2026-05-19):
 *   - Oven on the LEFT (where whole pizzas slide out from)
 *   - Counter in the foreground / middle (where pizzas live for slicing + topping)
 *   - Guest area on the right (where customers approach from)
 *   - Freddy stands behind the counter to the kid's right
 *
 * Placeholder render: gradient + labeled zones until the Midjourney
 * background lands in `/public/images/backgrounds/superslice-interior.png`.
 * When the real PNG is available, this component drops a single `<img>`
 * as a background layer — no other structural change needed.
 *
 * Children render on top of the scene (Table, FreddyCharacter, GuestArea,
 * speech bubbles, etc.).
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
      <img
        src="/images/backgrounds/superslice-interior.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {children}
    </div>
  );
}
