/**
 * MixedNumberDisplay — big numeral with optional fraction.
 *
 * Used by V3 notation beats (15, 16, 20, 32, 35) to render the
 * symbolic form of what the kid just built physically. Examples:
 *
 *   whole=2                                 → "2"
 *   whole=2, numerator=1, denominator=2     → "2 ½"
 *   numerator=1, denominator=4              → "¼"
 *
 * Pure render. No animation here — parent can wrap in a motion.div
 * to fade or pop on appearance.
 */

export interface MixedNumberDisplayProps {
  /** Whole-number part (rendered large). Omit for a pure fraction. */
  whole?: number;
  /** Fraction numerator. Render only if both numerator + denominator set. */
  numerator?: number;
  /** Fraction denominator. */
  denominator?: number;
}

export function MixedNumberDisplay({
  whole,
  numerator,
  denominator,
}: MixedNumberDisplayProps) {
  const hasFraction = numerator !== undefined && denominator !== undefined;
  const hasWhole = whole !== undefined;

  return (
    <div
      data-testid="mixed-number"
      className="inline-flex items-center gap-3 font-mono font-bold text-sb-ink"
    >
      {hasWhole && (
        <span data-testid="mixed-number-whole" className="text-8xl leading-none">
          {whole}
        </span>
      )}
      {hasFraction && (
        <span
          data-testid="mixed-number-fraction"
          className="inline-flex flex-col items-center text-5xl leading-[0.95]"
        >
          <span data-testid="mixed-number-numerator">{numerator}</span>
          <span className="h-[3px] w-full bg-sb-ink rounded-full my-1" />
          <span data-testid="mixed-number-denominator">{denominator}</span>
        </span>
      )}
    </div>
  );
}
