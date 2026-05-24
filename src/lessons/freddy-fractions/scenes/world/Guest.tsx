import { useState } from "react";
import type { GuestExpression } from "@/store/appStore";

/**
 * Guest — renders a customer character at the counter (P2.8).
 *
 * Three expression states: `neutral` (anticipating arrival), `frown`
 * (wrong fraction delivered), `smile` (happy with their order). State
 * lives in the Zustand `guests` slice; this component is a pure render.
 *
 * Asset matrix in `/public/images/characters/guests/`:
 *   <guest-id>-{neutral|frown|smile}.png  (3 files per guest)
 *
 * Until assets land (PT.2), `onError` swaps the broken image for a
 * styled placeholder — colored circle with the guest's initial + an
 * expression emoji — so the lesson is testable end-to-end without art.
 * When PNGs ship at the canonical paths, the placeholder disappears
 * automatically with zero code change.
 */
export interface GuestProps {
  /** Stable guest id matches `GuestState.id` + the asset filename prefix. */
  id: string;
  /** Current expression — drives the asset variant. */
  expression: GuestExpression;
  /** Display name used in the placeholder. Defaults to capitalized id. */
  displayName?: string;
  /** Optional className for sizing override. */
  className?: string;
}

const EXPRESSION_EMOJI: Record<GuestExpression, string> = {
  neutral: ":|",
  frown: ":(",
  smile: ":D",
};

const PLACEHOLDER_TINT: Record<string, string> = {
  maya: "#F4D996",
  theo: "#A8C8E1",
  nonna: "#E6B4B4",
};

function resolveSrc(id: string, expression: GuestExpression): string {
  return `/images/characters/guests/${id}-${expression}.png`;
}

export function Guest({
  id,
  expression,
  displayName,
  className = "h-[40vh] w-auto",
}: GuestProps) {
  const [assetMissing, setAssetMissing] = useState(false);
  const src = resolveSrc(id, expression);
  const tint = PLACEHOLDER_TINT[id] ?? "#E5E5E5";
  const initial = (displayName ?? id).charAt(0).toUpperCase();

  if (assetMissing) {
    return (
      <div
        data-testid="guest-character"
        data-guest-id={id}
        data-expression={expression}
        data-placeholder="true"
        className={`select-none pointer-events-none flex flex-col items-center justify-end ${className}`}
        aria-label={`${displayName ?? id} (${expression})`}
      >
        <div
          className="aspect-square h-[80%] rounded-full border-4 border-sb-ink shadow-lg flex flex-col items-center justify-center font-mono"
          style={{ backgroundColor: tint }}
        >
          <span className="text-[3rem] md:text-[4rem] font-bold text-sb-ink">
            {initial}
          </span>
          <span className="text-[1.2rem] md:text-[1.6rem] font-bold text-sb-ink/80 -mt-2">
            {EXPRESSION_EMOJI[expression]}
          </span>
        </div>
        <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
          {displayName ?? id}
        </span>
      </div>
    );
  }

  return (
    <div
      data-testid="guest-character"
      data-guest-id={id}
      data-expression={expression}
      className="select-none pointer-events-none"
    >
      <img
        src={src}
        alt={`${displayName ?? id} (${expression})`}
        draggable={false}
        onError={() => setAssetMissing(true)}
        className={`${className} drop-shadow-2xl`}
      />
    </div>
  );
}
