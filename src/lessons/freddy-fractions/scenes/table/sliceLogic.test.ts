import { describe, expect, it } from "vitest";
import {
  assetSrcFor,
  canSlice,
  childOffsetsFor,
  childSlotsFor,
  dimsForSlot,
  fractionForSlot,
  type PieceSlot,
} from "./sliceLogic";

describe("childSlotsFor / canSlice (decomposition graph)", () => {
  it("whole decomposes into the two halves", () => {
    expect(childSlotsFor("whole")).toEqual(["half-left", "half-right"]);
    expect(canSlice("whole")).toBe(true);
  });

  it("halves decompose into the correct quarters", () => {
    expect(childSlotsFor("half-left")).toEqual([
      "quarter-tl",
      "quarter-bl",
    ]);
    expect(childSlotsFor("half-right")).toEqual([
      "quarter-tr",
      "quarter-br",
    ]);
  });

  it("each quarter decomposes into its two eighth pieces", () => {
    expect(childSlotsFor("quarter-tl")).toEqual([
      "eighth-tl-t",
      "eighth-tl-l",
    ]);
    expect(childSlotsFor("quarter-tr")).toEqual([
      "eighth-tr-t",
      "eighth-tr-r",
    ]);
    expect(childSlotsFor("quarter-bl")).toEqual([
      "eighth-bl-b",
      "eighth-bl-l",
    ]);
    expect(childSlotsFor("quarter-br")).toEqual([
      "eighth-br-b",
      "eighth-br-r",
    ]);
  });

  it("eighths are terminal (cannot slice further)", () => {
    const eighthSlots: PieceSlot[] = [
      "eighth-tl-t",
      "eighth-tl-l",
      "eighth-tr-t",
      "eighth-tr-r",
      "eighth-bl-b",
      "eighth-bl-l",
      "eighth-br-b",
      "eighth-br-r",
    ];
    for (const slot of eighthSlots) {
      expect(childSlotsFor(slot)).toBeNull();
      expect(canSlice(slot)).toBe(false);
    }
  });
});

describe("fractionForSlot", () => {
  it("maps each slot family to the right fraction", () => {
    expect(fractionForSlot("whole")).toBe("1");
    expect(fractionForSlot("half-left")).toBe("1/2");
    expect(fractionForSlot("half-right")).toBe("1/2");
    expect(fractionForSlot("quarter-tl")).toBe("1/4");
    expect(fractionForSlot("quarter-br")).toBe("1/4");
    expect(fractionForSlot("eighth-tl-t")).toBe("1/8");
    expect(fractionForSlot("eighth-br-r")).toBe("1/8");
  });
});

describe("dimsForSlot", () => {
  it("renders the whole at full baseSize square", () => {
    expect(dimsForSlot("whole", 300)).toEqual({ width: 300, height: 300 });
  });

  it("renders halves as tall rectangles (half-width, full-height)", () => {
    expect(dimsForSlot("half-left", 300)).toEqual({
      width: 150,
      height: 300,
    });
    expect(dimsForSlot("half-right", 200)).toEqual({
      width: 100,
      height: 200,
    });
  });

  it("renders quarters as half-sized squares", () => {
    expect(dimsForSlot("quarter-tl", 300)).toEqual({
      width: 150,
      height: 150,
    });
  });

  it("renders eighths in the same square frame as quarters (triangle inside)", () => {
    expect(dimsForSlot("eighth-tl-t", 300)).toEqual({
      width: 150,
      height: 150,
    });
    expect(dimsForSlot("eighth-br-r", 200)).toEqual({
      width: 100,
      height: 100,
    });
  });
});

describe("assetSrcFor", () => {
  it("resolves to the pepperoni-v1 directory by default", () => {
    expect(assetSrcFor("whole")).toBe(
      "/images/pizza/pepperoni-v1/whole.png",
    );
    expect(assetSrcFor("eighth-br-r")).toBe(
      "/images/pizza/pepperoni-v1/eighth-br-r.png",
    );
  });

  it("respects an explicit variant", () => {
    expect(assetSrcFor("half-left", "pepperoni-v1")).toBe(
      "/images/pizza/pepperoni-v1/half-left.png",
    );
  });

  it("resolves to the cheese-v1 directory when variant is cheese-v1", () => {
    expect(assetSrcFor("whole", "cheese-v1")).toBe(
      "/images/pizza/cheese-v1/whole.png",
    );
    expect(assetSrcFor("eighth-tl-t", "cheese-v1")).toBe(
      "/images/pizza/cheese-v1/eighth-tl-t.png",
    );
    expect(assetSrcFor("quarter-br", "cheese-v1")).toBe(
      "/images/pizza/cheese-v1/quarter-br.png",
    );
  });
});

describe("childOffsetsFor", () => {
  // Whole pizza is 320×320 (baseSize default in sandbox). Splits into two
  // halves of 160×320 — left half stays where it was, shifted left a bit
  // for the gap; right half moves to the parent's right-half position
  // plus the gap.
  const WHOLE_DIMS = { width: 320, height: 320 };
  const HALF_DIMS = { width: 160, height: 320 };
  const QUARTER_DIMS = { width: 160, height: 160 };

  it("positions halves so they occupy the parent's area with a gap between", () => {
    const [left, right] = childOffsetsFor("whole", WHOLE_DIMS);
    // Left half drifts left by GAP/2 = 16
    expect(left.dx).toBe(-16);
    expect(left.dy).toBe(0);
    // Right half sits at parent.width/2 + GAP/2 = 160 + 16 = 176
    expect(right.dx).toBe(176);
    expect(right.dy).toBe(0);
    // Verify the gap: left half ends at 0 + 160 - 16 = 144;
    // right half starts at 176. Gap = 176 - 144 = 32. ✓
    expect(right.dx - (left.dx + HALF_DIMS.width)).toBe(32);
  });

  it("positions quarters so they occupy the parent's area with a gap", () => {
    const [top, bottom] = childOffsetsFor("half-left", HALF_DIMS);
    expect(top.dx).toBe(0);
    expect(top.dy).toBe(-16);
    expect(bottom.dx).toBe(0);
    expect(bottom.dy).toBe(160 + 16); // parent.height/2 + GAP/2
    // Gap check: top quarter ends at -16 + 160 = 144;
    // bottom starts at 176. Gap = 32. ✓
    expect(bottom.dy - (top.dy + QUARTER_DIMS.height)).toBe(32);
  });

  // For eighths, each piece drifts in an L-shaped pattern toward its
  // quarter's outer corner — main drift perpendicular to retained edge,
  // secondary drift parallel to that edge. See sliceLogic for the full
  // rationale. Per-quarter expectations:

  it("splits TL quarter: t-eighth drifts up-and-left, l-eighth drifts left-and-up", () => {
    const [tlT, tlL] = childOffsetsFor("quarter-tl", QUARTER_DIMS);
    // tl-t (retains TOP edge): mostly UP (-32), slightly LEFT (-16)
    expect(tlT).toEqual({ dx: -16, dy: -32 });
    // tl-l (retains LEFT edge): mostly LEFT (-32), slightly UP (-16)
    expect(tlL).toEqual({ dx: -32, dy: -16 });
  });

  it("splits TR quarter: t-eighth drifts up-and-right, r-eighth drifts right-and-up", () => {
    const [trT, trR] = childOffsetsFor("quarter-tr", QUARTER_DIMS);
    expect(trT).toEqual({ dx: 16, dy: -32 });
    expect(trR).toEqual({ dx: 32, dy: -16 });
  });

  it("splits BL quarter: b-eighth drifts down-and-left, l-eighth drifts left-and-down", () => {
    const [blB, blL] = childOffsetsFor("quarter-bl", QUARTER_DIMS);
    expect(blB).toEqual({ dx: -16, dy: 32 });
    expect(blL).toEqual({ dx: -32, dy: 16 });
  });

  it("splits BR quarter: b-eighth drifts down-and-right, r-eighth drifts right-and-down", () => {
    const [brB, brR] = childOffsetsFor("quarter-br", QUARTER_DIMS);
    expect(brB).toEqual({ dx: 16, dy: 32 });
    expect(brR).toEqual({ dx: 32, dy: 16 });
  });

  it("returns zero offsets for terminal eighths (defensive)", () => {
    expect(
      childOffsetsFor("eighth-tl-t", { width: 160, height: 160 }),
    ).toEqual([
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 },
    ]);
  });
});
