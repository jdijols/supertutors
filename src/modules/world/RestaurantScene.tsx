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
      className="relative w-full h-full overflow-hidden bg-gradient-to-b from-mozzarella-100 to-mozzarella-50"
    >
      {/* Oven zone — left side, warm glow */}
      <div
        aria-hidden
        data-zone="oven"
        className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-oven-glow/30 via-tomato-400/10 to-transparent"
      >
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-terracotta-600 font-mono text-xs opacity-50">
          [OVEN ZONE — pizzas slide out from here]
        </div>
      </div>

      {/* Counter line — visual indicator of the bar foreground */}
      <div
        aria-hidden
        data-zone="counter-line"
        className="absolute left-0 right-0 bottom-32 h-2 bg-terracotta-300/40"
      />

      {/* Guest area — far right where customers approach */}
      <div
        aria-hidden
        data-zone="guest-area"
        className="absolute right-0 top-1/4 bottom-32 w-1/5"
      >
        <div className="absolute right-8 top-8 text-terracotta-600 font-mono text-xs opacity-50">
          [GUEST AREA]
        </div>
      </div>

      {children}

      {/* TODO swap to real Midjourney background:
          <img
            src="/images/backgrounds/superslice-interior.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover -z-10"
          />
      */}
    </div>
  );
}
