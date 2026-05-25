import type { Sign } from "../vocab";

/**
 * PromptCard — shows the current sign to practice, positioned
 * at the top-center of the practice screen overlaying the camera feed.
 */
export function PromptCard({
  sign,
  current,
  total,
}: {
  sign: Sign;
  current: number;
  total: number;
}) {
  return (
    <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 z-20 text-center">
      <div className="bg-sb-card/90 backdrop-blur-sm rounded-2xl border border-sb-border shadow-xl shadow-sb-ink/10 px-6 sm:px-8 py-4 sm:py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sb-muted mb-1">
          Sign {current} of {total}
        </p>
        <h2 className="font-mono font-bold text-2xl sm:text-3xl tracking-[-0.02em] text-sb-ink">
          {sign.glyph}
        </h2>
      </div>
    </div>
  );
}
