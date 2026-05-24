import type { PizzaFraction } from "./Pizza";

/**
 * Proximity detection — pure functions for the drag-to-compare mechanic.
 *
 * Beat 6 (AHA): kid drags two quarters next to a half. We detect that the
 * pieces are close, sum their fractional areas, then decide whether the
 * cluster admits a partition into two equal-area subsets ("equal") or not.
 *
 * "Equal" semantics: there exists at least one way to split the cluster
 * into two non-empty subsets with the same total fractional area. For the
 * AHA cluster {1/4, 1/4, 1/2} the partition {{1/4, 1/4}, {1/2}} works.
 *
 * The Brain (tutorMachine) consumes `PROXIMITY_DETECTED { pieceIds[],
 * totalArea, comparison }` and branches on `comparison === "equal"`. See
 * PRD §5.1.1 — Beat 5 (AHA) event payloads.
 */

export interface ProximityPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fraction: PizzaFraction;
}

export interface ProximityGroup {
  pieceIds: string[];
  /** Sum of each piece's fractional area, normalized to a 1-pizza unit. */
  totalArea: number;
  /** "equal" iff the group admits a partition into two equal-area subsets. */
  comparison: "equal" | "not_equal";
}

/** Default proximity threshold (px). PRD §5.1.1 — "near each other" ≈ 20pt. */
export const PROXIMITY_THRESHOLD_PX = 20;

const FRACTION_VALUES: Record<PizzaFraction, number> = {
  "1": 1,
  "1/2": 0.5,
  "1/3": 1 / 3,
  "1/4": 0.25,
  "1/8": 0.125,
};

export function fractionToNumber(fraction: PizzaFraction): number {
  return FRACTION_VALUES[fraction];
}

/**
 * Euclidean gap between two axis-aligned bounding boxes. Overlapping or
 * touching rectangles return 0.
 */
export function pieceGap(a: ProximityPiece, b: ProximityPiece): number {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;
  const dx = Math.max(0, Math.max(a.x - bRight, b.x - aRight));
  const dy = Math.max(0, Math.max(a.y - bBottom, b.y - aBottom));
  return Math.sqrt(dx * dx + dy * dy);
}

export function piecesAreClose(
  a: ProximityPiece,
  b: ProximityPiece,
  thresholdPx: number = PROXIMITY_THRESHOLD_PX,
): boolean {
  return pieceGap(a, b) <= thresholdPx;
}

/**
 * Brute-force subset-sum: does the multiset of areas admit a partition
 * into two non-empty subsets with equal total? Our domain is ≤ 8 pieces
 * (capped at pizza eighths in a single cluster), so 2^N is fine.
 *
 * Epsilon comparison accounts for 1/3 floating-point drift — though 1/3
 * pieces are display-only in Beat 3 vocab and won't enter the bisect tree.
 */
export function admitsEqualPartition(areas: number[]): boolean {
  if (areas.length < 2) return false;
  const total = areas.reduce((s, a) => s + a, 0);
  const half = total / 2;
  const eps = 1e-9;
  const limit = (1 << areas.length) - 1;
  for (let mask = 1; mask < limit; mask++) {
    let sum = 0;
    for (let i = 0; i < areas.length; i++) {
      if (mask & (1 << i)) sum += areas[i];
    }
    if (Math.abs(sum - half) < eps) return true;
  }
  return false;
}

/**
 * Connected-component grouping over the proximity graph: pieces A and B
 * are linked iff they are within `thresholdPx` edge-to-edge. Singletons
 * are excluded — proximity by definition needs ≥ 2 pieces.
 */
export function findProximityGroups(
  pieces: ProximityPiece[],
  thresholdPx: number = PROXIMITY_THRESHOLD_PX,
): ProximityGroup[] {
  if (pieces.length < 2) return [];

  const parent = pieces.map((_, i) => i);
  const find = (i: number): number => {
    let cur = i;
    while (parent[cur] !== cur) {
      parent[cur] = parent[parent[cur]];
      cur = parent[cur];
    }
    return cur;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };

  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      if (piecesAreClose(pieces[i], pieces[j], thresholdPx)) {
        union(i, j);
      }
    }
  }

  const buckets = new Map<number, number[]>();
  for (let i = 0; i < pieces.length; i++) {
    const root = find(i);
    const bucket = buckets.get(root);
    if (bucket) bucket.push(i);
    else buckets.set(root, [i]);
  }

  const groups: ProximityGroup[] = [];
  for (const indices of buckets.values()) {
    if (indices.length < 2) continue;
    const areas = indices.map((i) => fractionToNumber(pieces[i].fraction));
    const totalArea = areas.reduce((s, a) => s + a, 0);
    const comparison: ProximityGroup["comparison"] = admitsEqualPartition(areas)
      ? "equal"
      : "not_equal";
    groups.push({
      pieceIds: indices.map((i) => pieces[i].id),
      totalArea,
      comparison,
    });
  }
  return groups;
}
