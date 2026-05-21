import type { PizzaFraction } from "./Pizza";

/**
 * Slice logic — pure functions describing how pizza pieces decompose.
 *
 * No React, no state — just slot mapping, dimension math, and the
 * decomposition graph. The React hook (`useSandboxPieces`) consumes these
 * to manage live state on the table.
 *
 * Decomposition graph (bisect-only, capped at eighths):
 *   whole         → [half-left, half-right]
 *   half-left     → [quarter-tl, quarter-bl]
 *   half-right    → [quarter-tr, quarter-br]
 *   quarter-{tl,tr,bl,br} → [eighth-{x}t/b/l/r, eighth-{x}t/b/l/r]
 *   eighth-{...}  → (terminal — cannot slice further)
 *
 * Eighth naming matches the asset filenames:
 *   {parent-quarter}-{outer-crust-edge} → e.g., `eighth-tl-t` = top-left
 *   quarter, top crust edge retained.
 */

export type PieceSlot =
  | "whole"
  | "half-left"
  | "half-right"
  | "quarter-tl"
  | "quarter-tr"
  | "quarter-bl"
  | "quarter-br"
  | "eighth-tl-t"
  | "eighth-tl-l"
  | "eighth-tr-t"
  | "eighth-tr-r"
  | "eighth-bl-b"
  | "eighth-bl-l"
  | "eighth-br-b"
  | "eighth-br-r";

export type PizzaVariant = "pepperoni-v1" | "cheese-v1";

const SLICE_MAP: Partial<Record<PieceSlot, readonly [PieceSlot, PieceSlot]>> = {
  whole: ["half-left", "half-right"],
  "half-left": ["quarter-tl", "quarter-bl"],
  "half-right": ["quarter-tr", "quarter-br"],
  "quarter-tl": ["eighth-tl-t", "eighth-tl-l"],
  "quarter-tr": ["eighth-tr-t", "eighth-tr-r"],
  "quarter-bl": ["eighth-bl-b", "eighth-bl-l"],
  "quarter-br": ["eighth-br-b", "eighth-br-r"],
};

/** Returns the two children a slot decomposes into, or null if terminal (an eighth). */
export function childSlotsFor(
  slot: PieceSlot,
): readonly [PieceSlot, PieceSlot] | null {
  return SLICE_MAP[slot] ?? null;
}

/** Whether a piece at this slot can still be sliced. False for eighths. */
export function canSlice(slot: PieceSlot): boolean {
  return slot in SLICE_MAP;
}

/** Fraction of a whole pizza this slot represents. */
export function fractionForSlot(slot: PieceSlot): PizzaFraction {
  if (slot === "whole") return "1";
  if (slot.startsWith("half")) return "1/2";
  if (slot.startsWith("quarter")) return "1/4";
  return "1/8";
}

/**
 * Renderable dimensions for a slot, given the base size of a whole pizza.
 *
 * - whole: baseSize × baseSize (square)
 * - half:  (baseSize/2) × baseSize (tall rectangle)
 * - quarter & eighth: (baseSize/2) × (baseSize/2) (square frame; eighth's
 *   triangle is inside the frame with transparent corners)
 */
export function dimsForSlot(
  slot: PieceSlot,
  baseSize: number,
): { width: number; height: number } {
  if (slot === "whole") return { width: baseSize, height: baseSize };
  if (slot.startsWith("half"))
    return { width: baseSize / 2, height: baseSize };
  return { width: baseSize / 2, height: baseSize / 2 };
}

/** Resolves a slot to its PNG asset path under a given pizza variant. */
export function assetSrcFor(
  slot: PieceSlot,
  variant: PizzaVariant = "pepperoni-v1",
): string {
  return `/images/pizza/${variant}/${slot}.png`;
}

/**
 * Where the two child pieces appear relative to the parent's position when
 * a slice happens. The children together should occupy the parent's
 * original area, with a small visible gap between them — like a real
 * pizza that's been cut and lightly pulled apart.
 *
 * Positions are computed using the PARENT's dimensions:
 *
 *   - whole → halves (split vertically down the middle):
 *       left half at  (parent.x − GAP/2,                parent.y)
 *       right half at (parent.x + parent.width/2 + GAP/2, parent.y)
 *     Each half occupies the original left/right half of the parent's
 *     area, shifted outward by GAP/2 so there's a GAP-px gap between them.
 *
 *   - half → quarters (split horizontally across the middle):
 *       top quarter at (parent.x, parent.y − GAP/2)
 *       bottom quarter at (parent.x, parent.y + parent.height/2 + GAP/2)
 *     Same pattern, vertical axis.
 *
 *   - quarter → eighths (diagonal cut into 2 triangles inside a square
 *     frame): each eighth's square frame is the same dimensions as the
 *     quarter, but the visible triangle is in a specific corner. We
 *     offset each eighth in the direction its triangle should "drift"
 *     perpendicular to the diagonal cut, giving the triangles a visible
 *     diagonal gap of GAP * √2 / 2 ≈ 0.71 × GAP.
 */
const GAP_PX = 32;

export function childOffsetsFor(
  parentSlot: PieceSlot,
  parentDims: { width: number; height: number },
): readonly [
  { dx: number; dy: number },
  { dx: number; dy: number },
] {
  const { width: W, height: H } = parentDims;
  const halfGap = GAP_PX / 2;

  if (parentSlot === "whole") {
    return [
      { dx: -halfGap, dy: 0 }, // half-left
      { dx: W / 2 + halfGap, dy: 0 }, // half-right
    ];
  }

  if (parentSlot.startsWith("half")) {
    return [
      { dx: 0, dy: -halfGap }, // top quarter
      { dx: 0, dy: H / 2 + halfGap }, // bottom quarter
    ];
  }

  if (parentSlot.startsWith("quarter")) {
    // New "corner-pair" scheme (2026-05-20): the previous perpendicular-
    // to-cut offset pulled eighths from adjacent quarters TOWARD each
    // other in the center of the pizza, making their bounding boxes
    // overlap and their hypotenuses cross — visually it looked like the
    // 8 triangles recombined into 4 new diamond-shaped quarters instead
    // of staying as "8 pieces of an original quarter cut."
    //
    // New approach — each eighth drifts in TWO axes:
    //   MAIN drift: perpendicular to its retained crust edge, AWAY from
    //     the pizza center (e.g., a 't' eighth drifts UP, an 'l' eighth
    //     drifts LEFT)
    //   SECONDARY drift: parallel to its retained crust edge, TOWARD its
    //     own quarter's outer corner (e.g., a 't' eighth from the TL
    //     quarter drifts LEFT; the same 't' eighth from TR drifts RIGHT)
    //
    // Result: the 8 triangles form 4 distinct "corner pairs" matching
    // their original quarters, with no cross-quarter overlap. Within
    // each pair the two triangles separate along an L-shape toward
    // their quarter's outer corner.
    const MAIN = GAP_PX; // 32 — main drift perpendicular to retained edge
    const SECONDARY = GAP_PX / 2; // 16 — drift along the retained edge
    switch (parentSlot) {
      case "quarter-tl":
        // [eighth-tl-t (retains TOP), eighth-tl-l (retains LEFT)]
        return [
          { dx: -SECONDARY, dy: -MAIN }, // tl-t: mostly UP, slightly LEFT
          { dx: -MAIN, dy: -SECONDARY }, // tl-l: mostly LEFT, slightly UP
        ];
      case "quarter-tr":
        // [eighth-tr-t (retains TOP), eighth-tr-r (retains RIGHT)]
        return [
          { dx: SECONDARY, dy: -MAIN }, // tr-t: mostly UP, slightly RIGHT
          { dx: MAIN, dy: -SECONDARY }, // tr-r: mostly RIGHT, slightly UP
        ];
      case "quarter-bl":
        // [eighth-bl-b (retains BOTTOM), eighth-bl-l (retains LEFT)]
        return [
          { dx: -SECONDARY, dy: MAIN }, // bl-b: mostly DOWN, slightly LEFT
          { dx: -MAIN, dy: SECONDARY }, // bl-l: mostly LEFT, slightly DOWN
        ];
      case "quarter-br":
        // [eighth-br-b (retains BOTTOM), eighth-br-r (retains RIGHT)]
        return [
          { dx: SECONDARY, dy: MAIN }, // br-b: mostly DOWN, slightly RIGHT
          { dx: MAIN, dy: SECONDARY }, // br-r: mostly RIGHT, slightly DOWN
        ];
    }
  }

  return [
    { dx: 0, dy: 0 },
    { dx: 0, dy: 0 },
  ];
}
