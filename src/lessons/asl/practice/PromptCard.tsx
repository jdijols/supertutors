import type { Sign } from "../vocab";

/**
 * PromptCard — shows the current sign to practice, positioned at the
 * top-center of the practice screen overlaying the camera feed.
 *
 * Also serves as the "back to grid" affordance. When `onBack` is set,
 * the card becomes a button; tapping it returns to the letter grid (so
 * the user can pick a different letter at any time, no 10-second wait,
 * no separate "skip" pill). The card sprouts a tiny ← grid hint to
 * communicate the affordance.
 */
export function PromptCard({
  sign,
  current,
  total,
  onBack,
}: {
  sign: Sign;
  current: number;
  total: number;
  onBack?: () => void;
}) {
  const inner = (
    <div className="bg-sb-card/95 backdrop-blur-sm rounded-2xl border border-sb-border shadow-xl shadow-sb-ink/10 px-6 sm:px-8 py-4 sm:py-5 text-center transition-transform duration-200 hover:scale-[1.02]">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sb-muted mb-1">
        Sign {current} of {total}
      </p>
      <h2 className="font-mono font-bold text-2xl sm:text-3xl tracking-[-0.02em] text-sb-ink">
        {sign.glyph}
      </h2>
      {onBack && (
        <p
          aria-hidden
          className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-sb-muted"
        >
          ← Tap to choose another letter
        </p>
      )}
    </div>
  );

  return (
    <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-20">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={`${sign.glyph} — tap to return to letter grid`}
          className="
            block focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink rounded-2xl
          "
        >
          {inner}
        </button>
      ) : (
        inner
      )}
    </div>
  );
}
