import { useCallback, useRef, useState } from "react";
import type { PizzaFraction } from "./Pizza";
import { fractionToNumber } from "./proximity";
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
 * Sum the fractional area of all pieces currently on the table — gives
 * the "effective pizza count" of the workspace.
 *
 * Examples:
 *   - 1 whole pizza → 1.0
 *   - 2 wholes sliced into 8 eighths each → still 2.0 (slicing preserves
 *     mass; just more pieces with smaller fractions)
 *   - 4 wholes added, then a 1/2 piece delivered → 3.5
 *
 * Used by `canAddPizza` so the add cap responds to deliveries: when the
 * kid sends a slice (or a whole) to the delivery box, the workspace
 * mass goes down by exactly that fraction and the add button re-enables
 * accordingly.
 */
function workspaceMass(pieces: { fraction: PizzaFraction }[]): number {
  return pieces.reduce((sum, p) => sum + fractionToNumber(p.fraction), 0);
}

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
  /**
   * V3: which guest's portion this slice belongs to (e.g., "maya", "theo").
   * `undefined` = free on the table. Sliced children inherit `guestId`
   * from the parent. "In a box" and "free" are mutually exclusive — there
   * is no third state. See `docs/adr/0001-v3-manipulative-state-
   * architecture.md` for the reasoning vs. a sidecar Map.
   */
  guestId?: string;
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
  /**
   * V3 lesson-mode slice cap. When set, `slice()` refuses to produce
   * children with fractions smaller than this. E.g., `"1/4"` caps slicing
   * at quarters (eighths are blocked). The principle: during the scripted
   * lesson (vs. exploration mode), heavily constrain student actions so
   * the workspace can't drift into a state the lesson can't recover from.
   * Per-beat configuration lives in the lesson stage machine.
   */
  maxFraction?: PizzaFraction;
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

      // V3 lesson-mode cap: refuse if children would be smaller than the
      // configured minimum fraction. Keeps the workspace inside the set
      // of states the scripted lesson knows how to recover from. During
      // exploration mode, `maxFraction` is undefined and slicing is free.
      if (options.maxFraction !== undefined) {
        const childFraction = fractionForSlot(childSlots[0]);
        if (fractionToNumber(childFraction) < fractionToNumber(options.maxFraction)) {
          return null;
        }
      }

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
          guestId: parent.guestId,
        };
      }
    },
    [pieces, baseSize, nextId, options.maxFraction],
  );

  const move = useCallback((pieceId: string, x: number, y: number) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, x, y, enterFromX: undefined } : p)),
    );
  }, []);

  /**
   * V3: assign or clear a piece's `guestId`. Pass `undefined` to clear
   * (e.g., when a piece is dragged out of a `GuestBox` back onto the
   * free table). "In a box" and "free" are mutually exclusive — there
   * is no third state.
   */
  const setGuestId = useCallback(
    (pieceId: string, guestId: string | undefined) => {
      setPieces((prev) =>
        prev.map((p) => (p.id === pieceId ? { ...p, guestId } : p)),
      );
    },
    [],
  );

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
      // Rule: only add another whole pizza if the workspace mass is at
      // most `maxPizzas - 1`. With maxPizzas=4 that means: mass ≤ 3
      // → button enabled; mass > 3 → button disabled. A fresh whole
      // brings the table to exactly maxPizzas (4.0) in the boundary
      // case. Deliveries lower the mass by the delivered piece's
      // fraction, so the cap reopens automatically.
      if (workspaceMass(pieces) > maxPizzas - 1) return null;

      const viewportW =
        options.viewportWidth ??
        (typeof window !== "undefined" ? window.innerWidth : 1980);

      // Entry zone: just right of the oven (rough left margin), vertical
      // position matches the default whole-pizza Y so it lands "on the
      // counter" rather than mid-air covering Freddy's face. Keep this
      // in sync with `defaultInitialPosition` in LessonTable.
      const entryX = 40;
      const entryY = Math.max(
        280,
        (typeof window !== "undefined" ? window.innerHeight : 1080) * 0.55,
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
  }, [initialPieces]);

  /**
   * V3: reset the workspace to an explicit new piece set. Used for
   * scene transitions where the new scene starts from a different
   * arrangement than the lesson's original initialPieces (e.g., Scene
   * 2 spawns 5 fresh pizzas, replacing whatever Scene 1 left behind).
   */
  const resetTo = useCallback((newInitial: SandboxPiece[]) => {
    setPieces(newInitial);
    idCounter.current = newInitial.length;
  }, []);

  /**
   * Pre-flight check: would the next addPizza() succeed? Two gates:
   *   1. Mass cap: current workspace mass must be ≤ `maxPizzas - 1`
   *      (so adding a fresh whole brings the table to at most
   *      `maxPizzas`). With maxPizzas=4, that's `mass ≤ 3`. Deliveries
   *      lower the mass and reopen the gate automatically.
   *   2. Cascade shift: a fresh whole at the entry zone must be able to
   *      shift existing pieces rightward without pushing anything past
   *      the viewport edge.
   */
  const canAddPizza = useCallback((): boolean => {
    if (workspaceMass(pieces) > maxPizzas - 1) return false;
    const viewportW =
      options.viewportWidth ??
      (typeof window !== "undefined" ? window.innerWidth : 1980);
    const entryY = Math.max(
      280,
      (typeof window !== "undefined" ? window.innerHeight : 1080) * 0.55,
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
    setGuestId,
    remove,
    addPizza,
    reset,
    resetTo,
    canAddPizza,
    /** Current effective pizza mass on the table (sum of fractions). */
    pizzaMass: workspaceMass(pieces),
    /** Max effective pizza mass before addPizza returns null. */
    maxPizzas,
  };
}
