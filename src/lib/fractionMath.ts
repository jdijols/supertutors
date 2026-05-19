/**
 * Pure helpers for fraction representation on the table.
 *
 * Used by:
 *   - Slicer mechanic (bisect a piece) — P2.3
 *   - Proximity detection (compare total areas) — P2.6
 *   - Toast labels on slice events — P2.7
 *
 * Constraint v1: denominators are powers of 2 (1, 2, 4, 8) per PRD §3.1.
 * Variable denominators (thirds, fifths) deferred to v2.
 */

export interface Fraction {
  readonly num: number;
  readonly den: number;
}

const FRACTION_PATTERN = /^(\d+)\/(\d+)$/;

export function parseFraction(s: string): Fraction {
  const match = FRACTION_PATTERN.exec(s.trim());
  if (!match) {
    throw new Error(`Invalid fraction string: "${s}"`);
  }
  const num = Number(match[1]);
  const den = Number(match[2]);
  if (den === 0) {
    throw new Error(`Denominator cannot be zero: "${s}"`);
  }
  return { num, den };
}

export function formatFraction(f: Fraction): string {
  return `${f.num}/${f.den}`;
}

export function fractionToNumber(f: Fraction): number {
  return f.num / f.den;
}

/**
 * Bisect a fraction into two equal halves.
 *
 * Doubles the denominator (keeping numerator the same), producing two pieces
 * whose areas each equal half the original.
 *
 *   bisect(1/1)   -> [1/2, 1/2]
 *   bisect(1/2)   -> [1/4, 1/4]
 *   bisect(1/4)   -> [1/8, 1/8]
 *   bisect(3/4)   -> [3/8, 3/8]   (used if the kid combines pieces — unlikely v1)
 */
export function bisect(f: Fraction): [Fraction, Fraction] {
  const halved: Fraction = { num: f.num, den: f.den * 2 };
  return [halved, halved];
}

/**
 * Sum of fraction values (as real numbers).
 * Used by area comparison.
 */
export function sumFractions(fs: ReadonlyArray<Fraction>): number {
  return fs.reduce((acc, f) => acc + fractionToNumber(f), 0);
}

/**
 * Compare two groups of fractions by total area.
 * Returns true if the sums are equal within a small epsilon to absorb
 * floating-point representational error.
 */
export function areasEqual(
  a: ReadonlyArray<Fraction>,
  b: ReadonlyArray<Fraction>,
  epsilon = 1e-9,
): boolean {
  return Math.abs(sumFractions(a) - sumFractions(b)) < epsilon;
}
