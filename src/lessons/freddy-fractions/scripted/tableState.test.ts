import { describe, expect, it } from "vitest";
import { deriveTableState, derivePerGuestTableState } from "./tableState";
import type { SandboxPiece } from "../scenes/table";

function makePiece(overrides: Partial<SandboxPiece> & { fraction: SandboxPiece["fraction"] }): SandboxPiece {
  return {
    id: overrides.id ?? `p-${Math.random()}`,
    slot: "whole",
    variant: "pepperoni-v1",
    src: "",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    ...overrides,
  } as SandboxPiece;
}

describe("deriveTableState", () => {
  it("returns wholePizza for a single whole piece", () => {
    const s = deriveTableState([makePiece({ fraction: "1" })]);
    expect(s.pattern).toBe("wholePizza");
    expect(s.counts).toEqual({ whole: 1, halves: 0, quarters: 0, eighths: 0 });
    expect(s.totalAreaUnits).toBe(1);
    expect(s.pizzaCount).toBe(1);
  });

  it("returns twoHalves for exactly two halves", () => {
    const s = deriveTableState([
      makePiece({ fraction: "1/2" }),
      makePiece({ fraction: "1/2" }),
    ]);
    expect(s.pattern).toBe("twoHalves");
    expect(s.totalAreaUnits).toBe(1);
  });

  it("returns oneHalfTwoQuarters for the target compare state", () => {
    const s = deriveTableState([
      makePiece({ fraction: "1/2" }),
      makePiece({ fraction: "1/4" }),
      makePiece({ fraction: "1/4" }),
    ]);
    expect(s.pattern).toBe("oneHalfTwoQuarters");
    expect(s.counts).toEqual({ whole: 0, halves: 1, quarters: 2, eighths: 0 });
    expect(s.totalAreaUnits).toBe(1);
  });

  it("returns fourQuarters when the kid over-sliced (recovery branch)", () => {
    const s = deriveTableState([
      makePiece({ fraction: "1/4" }),
      makePiece({ fraction: "1/4" }),
      makePiece({ fraction: "1/4" }),
      makePiece({ fraction: "1/4" }),
    ]);
    expect(s.pattern).toBe("fourQuarters");
    expect(s.totalAreaUnits).toBe(1);
  });

  it("returns hasEighths when any 1/8 piece exists", () => {
    const s = deriveTableState([
      makePiece({ fraction: "1/2" }),
      makePiece({ fraction: "1/4" }),
      makePiece({ fraction: "1/8" }),
      makePiece({ fraction: "1/8" }),
    ]);
    expect(s.pattern).toBe("hasEighths");
  });

  it("returns multiplePizzas when total area exceeds one pizza", () => {
    const s = deriveTableState([
      makePiece({ fraction: "1" }),
      makePiece({ fraction: "1/2" }),
    ]);
    expect(s.pattern).toBe("multiplePizzas");
    expect(s.totalAreaUnits).toBe(1.5);
    expect(s.pizzaCount).toBe(2);
  });

  it("returns other for mid-slice transient states (e.g. 1 half + 1 quarter)", () => {
    const s = deriveTableState([
      makePiece({ fraction: "1/2" }),
      makePiece({ fraction: "1/4" }),
    ]);
    expect(s.pattern).toBe("other");
    expect(s.totalAreaUnits).toBe(0.75);
  });

  it("returns other for partial deliveries (less than 1 pizza)", () => {
    const s = deriveTableState([
      makePiece({ fraction: "1/4" }),
      makePiece({ fraction: "1/4" }),
    ]);
    expect(s.pattern).toBe("other");
    expect(s.totalAreaUnits).toBe(0.5);
    expect(s.pizzaCount).toBe(1); // rounds up — but pattern still 'other'
  });

  it("returns other for empty table", () => {
    const s = deriveTableState([]);
    expect(s.pattern).toBe("other");
    expect(s.totalAreaUnits).toBe(0);
    expect(s.pizzaCount).toBe(0);
  });

  it("buckets pieces correctly by fraction", () => {
    const halves = [makePiece({ fraction: "1/2" }), makePiece({ fraction: "1/2" })];
    const s = deriveTableState(halves);
    expect(s.pieces.halves).toEqual(halves);
    expect(s.pieces.whole).toEqual([]);
  });

  it("passes proximity groups through unchanged", () => {
    const groups = [
      { pieceIds: ["a", "b"], totalArea: 0.5, comparison: "equal" as const },
    ];
    const s = deriveTableState([makePiece({ fraction: "1/4", id: "a" })], groups);
    expect(s.proximityGroups).toBe(groups);
  });
});

describe("derivePerGuestTableState (V3)", () => {
  it("groups pieces by guestId into separate buckets", () => {
    const result = derivePerGuestTableState([
      makePiece({ fraction: "1", id: "m1", guestId: "maya" }),
      makePiece({ fraction: "1", id: "m2", guestId: "maya" }),
      makePiece({ fraction: "1", id: "t1", guestId: "theo" }),
      makePiece({ fraction: "1", id: "f1" }), // no guestId = free
    ]);

    expect(result.byGuest.maya.counts.whole).toBe(2);
    expect(result.byGuest.theo.counts.whole).toBe(1);
    expect(result.free.counts.whole).toBe(1);
  });

  it("each bucket's pattern is computed from its own subset, not the global pool", () => {
    // Maya: 2 halves → pattern "twoHalves"
    // Theo: 1 half + 2 quarters → pattern "oneHalfTwoQuarters"
    // If buckets leaked into each other, neither pattern would match.
    const result = derivePerGuestTableState([
      makePiece({ fraction: "1/2", id: "mh1", guestId: "maya" }),
      makePiece({ fraction: "1/2", id: "mh2", guestId: "maya" }),
      makePiece({ fraction: "1/2", id: "th1", guestId: "theo" }),
      makePiece({ fraction: "1/4", id: "tq1", guestId: "theo" }),
      makePiece({ fraction: "1/4", id: "tq2", guestId: "theo" }),
    ]);

    expect(result.byGuest.maya.pattern).toBe("twoHalves");
    expect(result.byGuest.theo.pattern).toBe("oneHalfTwoQuarters");
  });
});
