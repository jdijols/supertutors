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
 *   - `reset()` — re-initialize to the supplied initial pieces.
 *
 * Pure slice math lives in `sliceLogic.ts`; this hook just wraps it in
 * React state + stable callbacks.
 */

export interface SandboxPiece {
  id: string;
  slot: PieceSlot;
  fraction: PizzaFraction;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  /** Pizza variant — selects which asset directory to load from. */
  variant?: PizzaVariant;
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
    src: assetSrcFor("whole", variant),
    x: opts.x,
    y: opts.y,
    width: dims.width,
    height: dims.height,
  };
}

export function useSandboxPieces(
  initialPieces: SandboxPiece[],
  options: UseSandboxPiecesOptions = {},
) {
  const baseSize = options.baseSize ?? 320;
  const variant = options.variant ?? "pepperoni-v1";

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
          src: assetSrcFor(slot, variant),
          x: parent.x + offset.dx,
          y: parent.y + offset.dy,
          width: dims.width,
          height: dims.height,
        };
      }
    },
    [pieces, baseSize, variant, nextId],
  );

  const move = useCallback((pieceId: string, x: number, y: number) => {
    setPieces((prev) =>
      prev.map((p) => (p.id === pieceId ? { ...p, x, y } : p)),
    );
  }, []);

  const reset = useCallback(() => {
    setPieces(initialPieces);
    idCounter.current = initialPieces.length;
  }, [initialPieces]);

  return { pieces, slice, move, reset };
}
