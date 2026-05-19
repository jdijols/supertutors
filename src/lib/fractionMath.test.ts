import { describe, expect, it } from "vitest";
import {
  areasEqual,
  bisect,
  formatFraction,
  fractionToNumber,
  parseFraction,
  sumFractions,
} from "./fractionMath";

describe("parseFraction", () => {
  it("parses standard fractions", () => {
    expect(parseFraction("1/2")).toEqual({ num: 1, den: 2 });
    expect(parseFraction("3/8")).toEqual({ num: 3, den: 8 });
    expect(parseFraction("  1/1  ")).toEqual({ num: 1, den: 1 });
  });

  it("throws on malformed input", () => {
    expect(() => parseFraction("1.5")).toThrow();
    expect(() => parseFraction("half")).toThrow();
    expect(() => parseFraction("1//2")).toThrow();
  });

  it("throws on zero denominator", () => {
    expect(() => parseFraction("1/0")).toThrow(/zero/i);
  });
});

describe("formatFraction", () => {
  it("round-trips with parseFraction", () => {
    const original = "3/8";
    expect(formatFraction(parseFraction(original))).toBe(original);
  });
});

describe("fractionToNumber", () => {
  it("converts to real numbers", () => {
    expect(fractionToNumber({ num: 1, den: 2 })).toBe(0.5);
    expect(fractionToNumber({ num: 1, den: 4 })).toBe(0.25);
    expect(fractionToNumber({ num: 2, den: 4 })).toBe(0.5);
  });
});

describe("bisect — the slicer mechanic", () => {
  it("bisects a whole pizza into halves", () => {
    const [a, b] = bisect({ num: 1, den: 1 });
    expect(a).toEqual({ num: 1, den: 2 });
    expect(b).toEqual({ num: 1, den: 2 });
  });

  it("bisects a half into quarters", () => {
    const [a, b] = bisect({ num: 1, den: 2 });
    expect(a).toEqual({ num: 1, den: 4 });
    expect(b).toEqual({ num: 1, den: 4 });
  });

  it("bisects a quarter into eighths", () => {
    const [a, b] = bisect({ num: 1, den: 4 });
    expect(a).toEqual({ num: 1, den: 8 });
    expect(b).toEqual({ num: 1, den: 8 });
  });

  it("preserves total area through bisection", () => {
    const original = { num: 1, den: 2 };
    const [a, b] = bisect(original);
    expect(fractionToNumber(a) + fractionToNumber(b)).toBeCloseTo(
      fractionToNumber(original),
    );
  });
});

describe("areasEqual — the proximity-compare mechanic", () => {
  it("recognizes 1/2 == 2/4 (the AHA case)", () => {
    expect(
      areasEqual(
        [{ num: 1, den: 2 }],
        [
          { num: 1, den: 4 },
          { num: 1, den: 4 },
        ],
      ),
    ).toBe(true);
  });

  it("recognizes 1/2 == 4/8", () => {
    expect(
      areasEqual(
        [{ num: 1, den: 2 }],
        [
          { num: 1, den: 8 },
          { num: 1, den: 8 },
          { num: 1, den: 8 },
          { num: 1, den: 8 },
        ],
      ),
    ).toBe(true);
  });

  it("recognizes unequal groups", () => {
    expect(areasEqual([{ num: 1, den: 2 }], [{ num: 1, den: 4 }])).toBe(false);
  });

  it("treats empty groups as zero-area equal", () => {
    expect(areasEqual([], [])).toBe(true);
  });
});

describe("sumFractions", () => {
  it("sums to the expected real number", () => {
    expect(
      sumFractions([
        { num: 1, den: 4 },
        { num: 1, den: 4 },
        { num: 1, den: 4 },
      ]),
    ).toBeCloseTo(0.75);
  });
});
