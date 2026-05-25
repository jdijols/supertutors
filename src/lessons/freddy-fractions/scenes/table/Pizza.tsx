import type { CSSProperties } from "react";

/**
 * Pizza — thin raster wrapper that renders a single pizza asset (whole or
 * sliced piece) generated via ChatGPT/gpt-image-1 in the same Freddy thread
 * for style continuity.
 *
 * Replaces the prior procedural-SVG approach (rejected 2026-05-19 — couldn't
 * close the aesthetic gap with the Pixar-painted Freddy + interior in our
 * 5-day window). Per-pepperoni tap logic was also removed in that same call;
 * Beat 1.5 (now Beat 3 — Numerator/Denominator) counts SLICES with pepperoni
 * vs. total slices, not individual pepperoni discs.
 *
 * Asset directory: `public/lessons/freddy-fractions/images/pizza/<variant>/{whole,half-*,quarter-*,eighth-*}.png`
 *
 * The component itself is generic — it just renders an <img>. The slicing
 * mechanic + which asset corresponds to which fraction lives one layer up,
 * in the slicer / Table workspace.
 */

/**
 * Fractions a Pizza piece can represent.
 *
 * - "1", "1/2", "1/4", "1/8" come from the bisect slicing tree
 *   (whole → halves → quarters → eighths).
 * - "1/3" is display-only — used to render the static "thirds" example
 *   in Beat 3 (Numerator/Denominator vocab). Not part of the slicer's
 *   decomposition graph; you can't slice into thirds in-app.
 */
export type PizzaFraction = "1" | "1/2" | "1/3" | "1/4" | "1/8";

export interface PizzaProps {
  /** Path to the PNG asset (e.g., "/lessons/freddy-fractions/images/pizza/pepperoni-v1/whole.png"). */
  src: string;
  /** Alt text for accessibility. Defaults to a fraction-aware description. */
  alt?: string;
  /** What fraction of a whole pizza this piece represents. Used for a11y +
      data attribute (for the state machine / tests to assert against). */
  fraction?: PizzaFraction;
  /** Render width in CSS pixels. */
  width?: number;
  /** Render height in CSS pixels. Defaults to width (square aspect — correct
      for the whole pizza and for quarter pieces; halves and eighths should
      pass an explicit height). */
  height?: number;
  /** Optional className for layout / positioning overrides. */
  className?: string;
  /** Inline style passthrough (positioning, transforms). */
  style?: CSSProperties;
}

function defaultAltFor(fraction: PizzaFraction | undefined): string {
  switch (fraction) {
    case "1":
      return "Whole pizza";
    case "1/2":
      return "Half pizza slice";
    case "1/3":
      return "Third pizza slice";
    case "1/4":
      return "Quarter pizza slice";
    case "1/8":
      return "Eighth pizza slice";
    default:
      return "Pizza";
  }
}

export function Pizza({
  src,
  alt,
  fraction,
  width = 220,
  height,
  className = "",
  style,
}: PizzaProps) {
  return (
    <img
      data-testid="pizza"
      data-fraction={fraction}
      src={src}
      alt={alt ?? defaultAltFor(fraction)}
      width={width}
      height={height ?? width}
      draggable={false}
      className={`select-none drop-shadow-xl ${className}`}
      style={style}
    />
  );
}
