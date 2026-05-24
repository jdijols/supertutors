import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildWholePiece,
  useSandboxPieces,
  type SandboxPiece,
} from "./useSandboxPieces";

function freshWhole(id = "whole-1", x = 200, y = 150): SandboxPiece {
  return buildWholePiece({ id, x, y, baseSize: 320 });
}

describe("buildWholePiece", () => {
  it("creates a whole pizza with the right defaults", () => {
    const p = buildWholePiece({ id: "w", x: 100, y: 50 });
    expect(p.slot).toBe("whole");
    expect(p.fraction).toBe("1");
    expect(p.src).toBe("/images/pizza/pepperoni-v1/whole.png");
    expect(p.x).toBe(100);
    expect(p.y).toBe(50);
    expect(p.width).toBe(320);
    expect(p.height).toBe(320);
  });

  it("respects an explicit baseSize", () => {
    const p = buildWholePiece({ id: "w", x: 0, y: 0, baseSize: 200 });
    expect(p.width).toBe(200);
    expect(p.height).toBe(200);
  });
});

describe("useSandboxPieces — initial state", () => {
  it("exposes the initial pieces array", () => {
    const initial = [freshWhole("w1"), freshWhole("w2", 600, 400)];
    const { result } = renderHook(() => useSandboxPieces(initial));
    expect(result.current.pieces).toHaveLength(2);
    expect(result.current.pieces[0].id).toBe("w1");
    expect(result.current.pieces[1].id).toBe("w2");
  });
});

describe("useSandboxPieces.slice", () => {
  it("replaces a whole with the two halves at the parent's position", () => {
    const { result } = renderHook(() =>
      useSandboxPieces([freshWhole("w1", 200, 150)]),
    );

    let sliceResult: ReturnType<typeof result.current.slice> | undefined;
    act(() => {
      sliceResult = result.current.slice("w1");
    });

    expect(result.current.pieces).toHaveLength(2);
    expect(result.current.pieces.find((p) => p.id === "w1")).toBeUndefined();

    const slots = result.current.pieces.map((p) => p.slot).sort();
    expect(slots).toEqual(["half-left", "half-right"]);

    // Children inherit the parent's coordinates with offsets
    for (const piece of result.current.pieces) {
      expect(piece.x).not.toBe(200); // shifted by offset
      expect(piece.y).toBe(150); // halves split horizontally, y unchanged
      expect(piece.width).toBe(160); // baseSize / 2
      expect(piece.height).toBe(320);
      expect(piece.fraction).toBe("1/2");
    }

    expect(sliceResult).not.toBeNull();
    expect(sliceResult!.parentFraction).toBe("1");
    expect(sliceResult!.childrenFraction).toBe("1/2");
    expect(sliceResult!.childIds).toHaveLength(2);
  });

  it("slices a half into two quarters with vertical offset", () => {
    const half: SandboxPiece = {
      id: "hl",
      slot: "half-left",
      fraction: "1/2",
      src: "/images/pizza/pepperoni-v1/half-left.png",
      x: 100,
      y: 200,
      width: 160,
      height: 320,
    };
    const { result } = renderHook(() => useSandboxPieces([half]));

    act(() => {
      result.current.slice("hl");
    });

    const slots = result.current.pieces.map((p) => p.slot).sort();
    expect(slots).toEqual(["quarter-bl", "quarter-tl"]);

    for (const piece of result.current.pieces) {
      expect(piece.fraction).toBe("1/4");
      expect(piece.width).toBe(160);
      expect(piece.height).toBe(160);
      expect(piece.x).toBe(100); // halves split vertically, x unchanged
    }

    // One child is above, one below
    const ys = result.current.pieces.map((p) => p.y).sort((a, b) => a - b);
    expect(ys[0]).toBeLessThan(200);
    expect(ys[1]).toBeGreaterThan(200);
  });

  it("slices a quarter into two eighths with diagonal offset", () => {
    const quarter: SandboxPiece = {
      id: "qtl",
      slot: "quarter-tl",
      fraction: "1/4",
      src: "/images/pizza/pepperoni-v1/quarter-tl.png",
      x: 400,
      y: 300,
      width: 160,
      height: 160,
    };
    const { result } = renderHook(() => useSandboxPieces([quarter]));

    act(() => {
      result.current.slice("qtl");
    });

    const slots = result.current.pieces.map((p) => p.slot).sort();
    expect(slots).toEqual(["eighth-tl-l", "eighth-tl-t"]);
    for (const piece of result.current.pieces) {
      expect(piece.fraction).toBe("1/8");
      expect(piece.width).toBe(160);
      expect(piece.height).toBe(160);
    }
  });

  it("returns null and leaves state unchanged when slicing an eighth (terminal)", () => {
    const eighth: SandboxPiece = {
      id: "e1",
      slot: "eighth-tl-t",
      fraction: "1/8",
      src: "/images/pizza/pepperoni-v1/eighth-tl-t.png",
      x: 0,
      y: 0,
      width: 160,
      height: 160,
    };
    const { result } = renderHook(() => useSandboxPieces([eighth]));

    let sliceResult: ReturnType<typeof result.current.slice> | undefined;
    act(() => {
      sliceResult = result.current.slice("e1");
    });

    expect(sliceResult).toBeNull();
    expect(result.current.pieces).toHaveLength(1);
    expect(result.current.pieces[0].id).toBe("e1");
  });

  it("returns null when the piece id is unknown", () => {
    const { result } = renderHook(() =>
      useSandboxPieces([freshWhole("w1")]),
    );
    let sliceResult: ReturnType<typeof result.current.slice> | undefined;
    act(() => {
      sliceResult = result.current.slice("does-not-exist");
    });
    expect(sliceResult).toBeNull();
    expect(result.current.pieces).toHaveLength(1);
  });

  it("supports cascading slices (whole → halves → quarters)", () => {
    const { result } = renderHook(() =>
      useSandboxPieces([freshWhole("w1", 200, 150)]),
    );

    act(() => {
      result.current.slice("w1");
    });
    expect(result.current.pieces).toHaveLength(2);

    const firstHalfId = result.current.pieces[0].id;
    act(() => {
      result.current.slice(firstHalfId);
    });

    expect(result.current.pieces).toHaveLength(3);
    const fractions = result.current.pieces
      .map((p) => p.fraction)
      .sort();
    expect(fractions).toEqual(["1/2", "1/4", "1/4"]);
  });
});

describe("useSandboxPieces.move", () => {
  it("updates a piece's coordinates", () => {
    const { result } = renderHook(() =>
      useSandboxPieces([freshWhole("w1", 0, 0)]),
    );

    act(() => {
      result.current.move("w1", 350, 220);
    });

    expect(result.current.pieces[0].x).toBe(350);
    expect(result.current.pieces[0].y).toBe(220);
  });

  it("is a no-op for unknown ids", () => {
    const initial = [freshWhole("w1", 50, 50)];
    const { result } = renderHook(() => useSandboxPieces(initial));

    act(() => {
      result.current.move("nope", 999, 999);
    });

    expect(result.current.pieces[0].x).toBe(50);
    expect(result.current.pieces[0].y).toBe(50);
  });
});

describe("useSandboxPieces.reset", () => {
  it("restores the original initial pieces", () => {
    const initial = [freshWhole("w1", 100, 100)];
    const { result } = renderHook(() => useSandboxPieces(initial));

    act(() => {
      result.current.slice("w1");
    });
    expect(result.current.pieces).toHaveLength(2);

    act(() => {
      result.current.reset();
    });
    expect(result.current.pieces).toHaveLength(1);
    expect(result.current.pieces[0].id).toBe("w1");
  });
});
