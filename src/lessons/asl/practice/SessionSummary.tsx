import { useAslStore } from "../store/aslStore";
import { getTrainedSigns } from "../vocab";

/**
 * SessionSummary — end-of-session overlay.
 *
 * Reads outcomes from the store and shows counts + two CTAs:
 *   - "Practice tough letters" → enters practice on the first non-mastered letter
 *   - "All done for today"     → calls onExit (returns to landing)
 *
 * Triggered either by the user tapping "End session" on LetterGrid, or
 * automatically when all 26 letters have been touched.
 *
 * Surface follows PromptCard / chrome conventions: sb-card, rounded-[22px],
 * sb-border, shadow-sb-ink/20. No basil-* fills — basil-400 is reserved
 * for the small ✓ semantic indicator (per ActivityFeed pattern).
 */
export function SessionSummary({ onExit }: { onExit: () => void }) {
  const outcomes = useAslStore((s) => s.outcomes);
  const selectSign = useAslStore((s) => s.selectSign);
  const setViewMode = useAslStore((s) => s.setViewMode);

  const letters = getTrainedSigns().filter((s) => /^[A-Z]$/.test(s.glyph));
  const mastered = letters.filter((l) => outcomes[l.id] === "mastered");
  const attempted = letters.filter((l) => outcomes[l.id] === "attempted");
  const untouched = letters.filter((l) => !outcomes[l.id]);

  const firstNonMastered = [...attempted, ...untouched][0];

  const handlePracticeTough = () => {
    if (firstNonMastered) {
      selectSign(firstNonMastered.id);
    } else {
      setViewMode("grid");
    }
  };

  return (
    <div
      data-testid="session-summary"
      className="absolute inset-0 z-30 flex items-center justify-center bg-sb-ink/60 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-[22px] bg-sb-card border border-sb-border shadow-xl shadow-sb-ink/20 p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sb-muted text-center">
          Session Summary
        </p>
        <h2 className="mt-2 text-center font-mono font-bold text-3xl sm:text-4xl tracking-[-0.02em] text-sb-ink">
          {mastered.length} of {letters.length}
        </h2>
        <p className="mt-1 text-center font-sans text-sm text-sb-muted">
          letters mastered today
        </p>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Mastered" value={mastered.length} tone="ink" />
          <Stat label="Tried" value={attempted.length} tone="accent" />
          <Stat label="Untouched" value={untouched.length} tone="muted" />
        </div>

        {/* Sample of next-up letters */}
        {firstNonMastered && (
          <div className="mt-5 px-4 py-3 rounded-2xl bg-sb-surface border border-sb-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-sb-muted">
              Next up
            </p>
            <p className="mt-1 font-mono text-sm text-sb-ink">
              {[...attempted, ...untouched]
                .slice(0, 6)
                .map((l) => l.glyph)
                .join(" · ")}
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-6 space-y-2">
          {firstNonMastered && (
            <button
              type="button"
              onClick={handlePracticeTough}
              className="
                w-full py-3 rounded-2xl
                border-2 border-sb-ink bg-sb-ink text-white
                font-mono text-xs uppercase tracking-[0.18em]
                shadow-xl shadow-sb-accent-deep/25
                hover:bg-sb-ink/90 transition-colors duration-200
                focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-card
              "
            >
              Practice tough letters →
            </button>
          )}
          <button
            type="button"
            onClick={onExit}
            className="
              w-full py-3 rounded-2xl
              bg-sb-surface text-sb-ink border border-sb-border
              font-mono text-xs uppercase tracking-[0.18em]
              hover:bg-sb-paper transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-card
            "
          >
            All done for today
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ink" | "accent" | "muted";
}) {
  const colorClass =
    tone === "ink"
      ? "text-sb-ink"
      : tone === "accent"
        ? "text-sb-accent-deep"
        : "text-sb-muted";

  return (
    <div className="rounded-2xl bg-sb-surface border border-sb-border px-3 py-3 text-center">
      <p className={`font-mono font-bold text-2xl ${colorClass}`}>{value}</p>
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-sb-muted">
        {label}
      </p>
    </div>
  );
}
