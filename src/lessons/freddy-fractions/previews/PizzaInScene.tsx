import { Pizza } from "../scenes/table/Pizza";
import { RestaurantScene } from "../scenes/world/RestaurantScene";

/**
 * PizzaInScene — preview the pizza assets composited into the real
 * SuperSlice restaurant scene, so we can judge whether the soft warm
 * gradient ChatGPT baked into the "transparent" PNGs reads as natural
 * (atmospheric oven-glow) or as an obvious rectangular halo around the
 * pizza on the wood counter.
 *
 * Shows the whole pizza centered on the counter (the static case) AND
 * a half-piece off to the side (the stress test — pieces will be dragged
 * around in Beat 2, and any rectangular background will follow them).
 *
 * If both look natural → background non-issue, proceed with quarters/eighths.
 * If the half looks like a card-with-pizza-on-it → fix transparency at the
 * source via the re-prompt.
 */

const ASSET_BASE = "/lessons/freddy-fractions/images/pizza/pepperoni-v1";

export function PizzaInScene() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-mozzarella-50">
      <RestaurantScene>
        {/* Empty — children of RestaurantScene sit at z-10 (behind the
            counter mask). The pizza pieces below sit at z-30 (ABOVE the
            counter mask) so they appear to rest on the counter surface. */}
      </RestaurantScene>

      {/* Whole pizza — centered on the counter, static case */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[18vh] z-30">
        <Pizza
          src={`${ASSET_BASE}/whole.png`}
          fraction="1"
          width={340}
        />
      </div>

      {/* Half-piece off to the right — the drag stress test. If a
          rectangular halo is visible here, dragging in Beat 2 will
          look broken. */}
      <div className="absolute right-[8%] bottom-[10vh] z-30">
        <Pizza
          src={`${ASSET_BASE}/half-right.png`}
          fraction="1/2"
          width={150}
          height={300}
        />
      </div>

      {/* Tiny floating label so you know what page you're on without
          obscuring the scene. */}
      <div className="absolute top-4 left-4 z-50 bg-mozzarella-50/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium text-terracotta-600 shadow">
        Scene preview · evaluate pizza-on-counter
      </div>
    </main>
  );
}
