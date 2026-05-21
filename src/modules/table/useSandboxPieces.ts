import { useCallback, useRef, useState } from "react";
import type { PizzaFraction } from "./Pizza";
import {
  assetSrcFor,
  canSlice,
  childOffsetsFor,
  childSlotsFor,
  dimsForSlot,
  fractionForSlot,
  type PieceSlot,
  type PizzaVariant,
} from "./sliceLogic";

/**
 * React hook managing the live state of pizza pieces on the sandbox table.
 *
 * Responsibilities:
 *   - Track the array of pieces currently on the table.
 *   - `slice(id)` — replace a piece with its 2 child pieces at the parent's
 *     position + offset. Returns metadata about what was sliced so the
 *     caller can fire a toast. Returns null if the piece can't be sliced
 *     (already an eighth) or doesn't exist.
 *   - `move(id, x, y)` — update a piece's position after a drag ends.
 *   - `addPizza(variant)` — add a fresh whole pizza at the left entry zone
 *     (right of the oven), shifting any existing pieces in the entry
 *     corridor rightward to make room. Returns the new piece id, or null
 *     if the table is too packed (every right-shift would push a piece
 *     off-screen).
 *   - `remove(id)` — remove a piece from the table (used by the delivery box).
 *   - `reset()` — re-initialize to the supplied initial pieces.
 *
 * Pure slice math lives in `sliceLogic.ts`; this hook just wraps it in
 * React state + stable callbacks.
 *
 * Per-piece variant: each `SandboxPiece` carries its own `variant` field so
 * pieces from different pizzas (plain vs pepperoni) coexist on the table
 * and slice correctly. The hook-level `options.variant` is only a default
 * for `buildWholePiece` convenience and the first `addPizza()` call.
 */

export interface SandboxPiece {
  id: string;
  slot: PieceSlot;
  fraction: PizzaFraction;
  variant: PizzaVariant;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Transient flag set the moment a piece is added via `addPizza()`. The
   * PizzaPiece reads this to play a slide-in animation from off-screen-left.
   * Cleared the tick after — never set again for the same piece.
   */
  enterFromX?: number;
}

export interface SliceResult {
  /** Fraction the parent had before slicing (e.g., "1/2"). */
  parentFraction: PizzaFraction;
  /** Fraction the resulting children share (e.g., "1/4"). */
  childrenFraction: PizzaFraction;
  /** IDs of the two new pieces. */
  childIds: [string, string];
}

export interface UseSandboxPiecesOptions {
  /** Base width of a whole pizza in pixels. Halves/quarters/eighths derive. */
  baseSize?: number;
  /** Default pizza variant for the first `addPizza()` if no variant supplied. */
  variant?: PizzaVariant;
  /** Maximum total whole-pizzas allowed (counted by initial-add events,
   *  not by piece count — slicing doesn't change this).  Defaults to 4. */
  maxPizzas?: number;
  /** Viewport width hint, used to clamp shifted pieces to the right edge.
   *  Falls back to window.innerWidth at runtime. */
  viewportWidth?: number;
}

/** Convenience: build a fresh whole-pizza piece at a given position. */
export function buildWholePiece(opts: {
  id: string;
  x: number;
  y: number;
  baseSize?: number;
  variant?: PizzaVariant;
}): SandboxPiece {
  const baseSize = opts.baseSize ?? 320;
  const variant = opts.variant ?? "pepperoni-v1";
  const dims = dimsForSlot("whole", baseSize);
  return {
    id: opts.id,
    slot: "whole",
    fraction: "1",
    variant,
    src: assetSrcFor("whole", variant),
    x: opts.x,
    y: opts.y,
    width: dims.width,
    height: dims.height,
  };
}

/**
 * Bounding-box overlap test. Returns true if the two rectangles intersect
 * (touch counts as no overlap — strict less-than on both axes).
 */
function overlaps(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Compute right-shifts needed to clear an entry corridor for a new pizza.
 *
 * Algorithm (iterative, collision-aware):
 *   1. Find any piece overlapping the entry corridor (new pizza's
 *      bounding rect).
 *   2. For each, compute the minimum delta-x to push it just past the
 *      right edge of the new pizza.
 *   3. After shifting, re-check: that shift may now overlap pieces to
 *      its right (cascade). Recurse until no more overlaps.
 *   4. If any shift would push a piece's right edge past `maxRight`,
 *      return null (can't make room — kid needs to clean up).
 *
 * Returns a map of `pieceId → new x` for every piece that needs to move,
 * or null if the shift is impossible.
 */
export function computeShiftToMakeRoom(
  newPizzaRect: { x: number; y: number; width: number; height: number },
  pieces: SandboxPiece[],
  maxRight: number,
): Map<string, number> | null {
  const shifts = new Map<string, number>();
  // Working positions — start from current piece positions, mutate as
  // we resolve cascades.
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const p of pieces) {
    positions.set(p.id, { x: p.x, y: p.y, width: p.width, height: p.height });
  }

  // Pieces overlapping the new pizza's corridor (initial pass).
  const queue: string[] = [];
  for (const p of pieces) {
    if (overlaps(newPizzaRect, positions.get(p.id)!)) {
      queue.push(p.id);
    }
  }

  // Cap iterations to avoid pathological loops if my math is wrong.
  let iterations = 0;
  const HARD_CAP = 200;

  while (queue.length > 0 && iterations < HARD_CAP) {
    iterations++;
    const id = queue.shift()!;
    const pos = positions.get(id)!;

    // Find the bounding rect that's currently overlapping this piece.
    // It's either the new pizza or another piece that was already shifted.
    let pushFrom = newPizzaRect;
    for (const [otherId, otherPos] of positions.entries()) {
      if (otherId === id) continue;
      if (overlaps(pos, otherPos) && otherPos.x + otherPos.width > pushFrom.x + pushFrom.width) {
        pushFrom = otherPos;
      }
    }

    // Compute new x so this piece sits just to the right of pushFrom.
    const newX = pushFrom.x + pushFrom.width + 4; // 4px breathing room
    if (newX + pos.width > maxRight) {
      // Can't fit — even with shifting, this piece would go off-screen.
      return null;
    }

    positions.set(id, { ...pos, x: newX });
    shifts.set(id, newX);

    // Re-check: did this shift create a new overlap on the right?
    for (const [otherId, otherPos] of positions.entries()) {
      if (otherId === id) continue;
      if (overlaps(positions.get(id)!, otherPos)) {
        if (!queue.includes(otherId)) queue.push(otherId);
      }
    }
  }

  if (iterations >= HARD_CAP) return null;
  return shifts;
}

export function useSandboxPieces(
  initialPieces: SandboxPiece[],
  options: UseSandboxPiecesOptions = {},
) {
  const baseSize = options.baseSize ?? 320;
  const defaultVariant = options.variant ?? "pepperoni-v1";
  const maxPizzas = options.maxPizzas ?? 4;

  const [pieces, setPieces] = useState<SandboxPiece[]>(initialPieces);
  const idCounter = useRef(initialPieces.length);
  // Count of whole-pizzas ever added (initial + addPizza calls). NOT the
  // current piece count — slicing doesn't increment this.
  const pizzaCount = useRef(initialPieces.length);

  const nextId = useCallback(() => {
    idCounter.current += 1;
    return `piece-${idCounter.current}`;
  }, []);

  const slice = useCallback(
    (pieceId: string): SliceResult | null => {
      const piece = pieces.find((p) => p.id === pieceId);
      if (!piece) return null;
      if (!canSlice(piece.slot)) return null;

      const childSlots = childSlotsFor(piece.slot);
      if (!childSlots) return null;

      const offsets = childOffsetsFor(piece.slot, {
        width: piece.width,
        height: piece.height,
      });

      const children: [SandboxPiece, SandboxPiece] = [
        buildChild(childSlots[0], piece, offsets[0]),
        buildChild(childSlots[1], piece, offsets[1]),
      ];

      setPieces((prev) => [
        ...prev.filter((p) => p.id !== pieceId),
        ...children,
      ]);

      return {
        parentFraction: piece.fraction,
        childrenFraction: fractionForSlot(childSlots[0]),
        childIds: [children[0].id, children[1].id],
      };

      function buildChild(
        slot: PieceSlot,
        parent: SandboxPiece,
        offset: { dx: number; dy: number },
      ): SandboxPiece {
        const dims = dimsForSlot(slot, baseSize);
        return {
          id: nextId(),
          slot,
          fraction: fractionForSlot(slot),
          variant: parent.variant,
          src: assetSrcFor(slot, parent.variant),
          x: parent.x + offset.dx,
          y: parent.y + offset.dy,
          width: dims.width,
          height: dims.height,
        };
      }
    },
    [pieces, baseSize, nextId],
  );

  const move = useCallback((pieceId: string, x: number, y: number) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, x, y, enterFromX: undefined } : p)),
    );
  }, []);

  const remove = useCallback((pieceId: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== pieceId));
  }, []);

  /**
   * Add a fresh whole pizza at the left entry zone, shifting existing
   * pieces rightward as needed to clear room. Returns the new piece's id
   * (slide-in animation handled by PizzaPiece via enterFromX), or null
   * if the table is too packed or the pizza cap is reached.
   */
  const addPizza = useCallback(
    (variant: PizzaVariant = defaultVariant): string | null => {
      if (pizzaCount.current >= maxPizzas) return null;

      const viewportW =
        options.viewportWidth ??
        (typeof window !== "undefined" ? window.innerWidth : 1980);

      // Entry zone: just right of the oven (rough left margin), vertical
      // position matches the default whole-pizza Y so it lands "on the
      // counter."
      const entryX = 40;
      const entryY = Math.max(
        140,
        (typeof window !== "undefined" ? window.innerHeight : 1080) * 0.28,
      );
      const dims = dimsForSlot("whole", baseSize);
      const entryRect = {
        x: entryX,
        y: entryY,
        width: dims.width,
        height: dims.height,
      };

      const shifts = computeShiftToMakeRoom(
        entryRect,
        pieces,
        viewportW,
      );
      if (!shifts) return null;

      pizzaCount.current += 1;
      const newId = `piece-${++idCounter.current}`;

      setPieces((prev) => {
        const shifted = prev.map((p) =>
          shifts.has(p.id) ? { ...p, x: shifts.get(p.id)!, enterFromX: undefined } : p,
        );
        const newPiece: SandboxPiece = {
          id: newId,
          slot: "whole",
          fraction: "1",
          variant,
          src: assetSrcFor("whole", variant),
          x: entryX,
          y: entryY,
          width: dims.width,
          height: dims.height,
          enterFromX: -dims.width - 40, // off-screen left
        };
        return [...shifted, newPiece];
      });

      return newId;
    },
    [pieces, baseSize, defaultVariant, maxPizzas, options.viewportWidth],
  );

  const reset = useCallback(() => {
    setPieces(initialPieces);
    idCounter.current = initialPieces.length;
    pizzaCount.current = initialPieces.length;
  }, [initialPieces]);

  /**
   * Pre-flight check: would the next addPizza() succeed? Runs the same
   * collision-shift math against the CURRENT pieces. Returns true if the
   * pizza cap hasn't been reached AND the cascade shift fits within the
   * viewport. Used to disable the AddPizzaButton when the table is too
   * packed even though the count hasn't yet hit `maxPizzas`.
   */
  const canAddPizza = useCallback((): boolean => {
    if (pizzaCount.current >= maxPizzas) return false;
    const viewportW =
      options.viewportWidth ??
      (typeof window !== "undefined" ? window.innerWidth : 1980);
    const entryY = Math.max(
      140,
      (typeof window !== "undefined" ? window.innerHeight : 1080) * 0.28,
    );
    const dims = dimsForSlot("whole", baseSize);
    const entryRect = {
      x: 40,
      y: entryY,
      width: dims.width,
      height: dims.height,
    };
    return computeShiftToMakeRoom(entryRect, pieces, viewportW) !== null;
  }, [pieces, baseSize, maxPizzas, options.viewportWidth]);

  return {
    pieces,
    slice,
    move,
    remove,
    addPizza,
    reset,
    canAddPizza,
    /** Current count of whole-pizzas added (incl. initial). */
    pizzaCount: pizzaCount.current,
    /** Max whole-pizzas allowed before addPizza returns null. */
    maxPizzas,
  };
}
