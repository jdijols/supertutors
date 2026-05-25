import { describe, expect, it } from "vitest";
import {
  PROXIMITY_THRESHOLD_PX,
  admitsEqualPartition,
  findProximityGroups,
  fractionToNumber,
  pieceGap,
  piecesAreClose,
  type ProximityPiece,
} from "./proximity";

const piece = (
  id: string,
  fraction: ProximityPiece["fraction"],
  x: number,
  y: number,
  width = 80,
  height = 80,
): ProximityPiece => ({ id, fraction, x, y, width, height });

describe("fractionToNumber", () => {
  it("maps each fraction to its numeric value", () => {
    expect(fractionToNumber("1")).toBe(1);
    expect(fractionToNumber("1/2")).toBe(0.5);
    expect(fractionToNumber("1/4")).toBe(0.25);
    expect(fractionToNumber("1/8")).toBe(0.125);
    expect(fractionToNumber("1/3")).toBeCloseTo(1 / 3, 10);
  });
});

describe("pieceGap", () => {
  it("returns 0 for overlapping pieces", () => {
    const a = piece("a", "1/2", 0, 0, 100, 100);
    const b = piece("b", "1/2", 50, 50, 100, 100);
    expect(pieceGap(a, b)).toBe(0);
  });

  it("returns 0 for edge-touching pieces", () => {
    const a = piece("a", "1/4", 0, 0, 100, 100);
    const b = piece("b", "1/4", 100, 0, 100, 100);
    expect(pieceGap(a, b)).toBe(0);
  });

  it("returns horizontal gap when pieces are aligned vertically", () => {
    const a = piece("a", "1/4", 0, 0, 100, 100);
    const b = piece("b", "1/4", 115, 0, 100, 100);
    expect(pieceGap(a, b)).toBe(15);
  });

  it("returns Euclidean distance for diagonal gaps", () => {
    const a = piece("a", "1/4", 0, 0, 10, 10);
    // dx = 3, dy = 4 → gap = 5
    const b = piece("b", "1/4", 13, 14, 10, 10);
    expect(pieceGap(a, b)).toBeCloseTo(5, 5);
  });
});

describe("piecesAreClose", () => {
  it("treats pieces inside the default threshold as close", () => {
    const a = piece("a", "1/4", 0, 0);
    const b = piece("b", "1/4", 80 + PROXIMITY_THRESHOLD_PX - 1, 0);
    expect(piecesAreClose(a, b)).toBe(true);
  });

  it("treats pieces beyond the default threshold as not close", () => {
    const a = piece("a", "1/4", 0, 0);
    const b = piece("b", "1/4", 80 + PROXIMITY_THRESHOLD_PX + 5, 0);
    expect(piecesAreClose(a, b)).toBe(false);
  });

  it("honors a custom threshold", () => {
    const a = piece("a", "1/4", 0, 0, 10, 10);
    const b = piece("b", "1/4", 100, 0, 10, 10);
    expect(piecesAreClose(a, b, 200)).toBe(true);
    expect(piecesAreClose(a, b, 50)).toBe(false);
  });
});

describe("admitsEqualPartition", () => {
  it("two equal pieces partition trivially", () => {
    expect(admitsEqualPartition([0.5, 0.5])).toBe(true);
  });

  it("AHA cluster {1/4, 1/4, 1/2} admits a partition", () => {
    expect(admitsEqualPartition([0.25, 0.25, 0.5])).toBe(true);
  });

  it("{1/4, 1/8, 1/8, 1/2} admits a partition", () => {
    expect(admitsEqualPartition([0.25, 0.125, 0.125, 0.5])).toBe(true);
  });

  it("{1/4, 1/2} does not admit a partition", () => {
    expect(admitsEqualPartition([0.25, 0.5])).toBe(false);
  });

  it("returns false for empty or singleton arrays", () => {
    expect(admitsEqualPartition([])).toBe(false);
    expect(admitsEqualPartition([0.5])).toBe(false);
  });

  it("returns false when total area cannot be split evenly", () => {
    // 1/4 + 1/2 + 1/8 = 7/8 → no equal partition
    expect(admitsEqualPartition([0.25, 0.5, 0.125])).toBe(false);
  });

  it("handles four eighths == half partition {1/8, 1/8, 1/8, 1/8, 1/2}", () => {
    expect(admitsEqualPartition([0.125, 0.125, 0.125, 0.125, 0.5])).toBe(true);
  });
});

describe("findProximityGroups", () => {
  it("returns empty when there are fewer than two pieces", () => {
    expect(findProximityGroups([])).toEqual([]);
    expect(findProximityGroups([piece("solo", "1", 0, 0)])).toEqual([]);
  });

  it("skips singletons with no close neighbors", () => {
    const pieces = [
      piece("a", "1/2", 0, 0, 50, 50),
      piece("b", "1/2", 800, 800, 50, 50),
    ];
    expect(findProximityGroups(pieces)).toEqual([]);
  });

  it("detects the AHA cluster {1/4, 1/4, 1/2} as 'equal'", () => {
    const pieces = [
      piece("half", "1/2", 0, 0, 100, 200),
      piece("q1", "1/4", 105, 0, 100, 100),
      piece("q2", "1/4", 105, 105, 100, 100),
    ];
    const groups = findProximityGroups(pieces);
    expect(groups).toHaveLength(1);
    expect(groups[0].pieceIds.sort()).toEqual(["half", "q1", "q2"]);
    expect(groups[0].totalArea).toBeCloseTo(1, 10);
    expect(groups[0].comparison).toBe("equal");
  });

  it("detects a mismatched cluster {1/4, 1/2} as 'not_equal'", () => {
    const pieces = [
      piece("half", "1/2", 0, 0, 100, 200),
      piece("q", "1/4", 105, 0, 100, 100),
    ];
    const groups = findProximityGroups(pieces);
    expect(groups).toHaveLength(1);
    expect(groups[0].totalArea).toBeCloseTo(0.75, 10);
    expect(groups[0].comparison).toBe("not_equal");
  });

  it("unions transitively (A close to B, B close to C)", () => {
    const pieces = [
      piece("a", "1/4", 0, 0, 50, 50),
      piece("b", "1/4", 55, 0, 50, 50),
      piece("c", "1/2", 110, 0, 50, 100),
    ];
    const groups = findProximityGroups(pieces);
    expect(groups).toHaveLength(1);
    expect(groups[0].pieceIds.sort()).toEqual(["a", "b", "c"]);
    expect(groups[0].comparison).toBe("equal");
  });

  it("separates two distant clusters into independent groups", () => {
    const pieces = [
      piece("a1", "1/2", 0, 0, 50, 50),
      piece("a2", "1/2", 55, 0, 50, 50),
      piece("b1", "1/4", 800, 800, 50, 50),
      piece("b2", "1/4", 855, 800, 50, 50),
    ];
    const groups = findProximityGroups(pieces);
    expect(groups).toHaveLength(2);
  });

  it("honors a custom threshold", () => {
    const pieces = [
      piece("a", "1/2", 0, 0, 50, 50),
      piece("b", "1/2", 200, 0, 50, 50), // 150px gap
    ];
    expect(findProximityGroups(pieces, 50)).toEqual([]);
    expect(findProximityGroups(pieces, 200)).toHaveLength(1);
  });
});
