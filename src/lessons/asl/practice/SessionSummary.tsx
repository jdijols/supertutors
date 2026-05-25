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
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-3xl bg-sb-card border border-sb-border shadow-2xl shadow-black/40 p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sb-muted text-center">
          Session Summary
        </p>
        <h2 className="mt-2 text-center font-mono font-bold text-3xl sm:text-4xl text-sb-ink">
          {mastered.length} of {letters.length}
        </h2>
        <p className="mt-1 text-center text-sb-muted text-sm">
          letters mastered today
        </p>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Mastered" value={mastered.length} accent="basil" />
          <Stat label="Tried" value={attempted.length} accent="accent" />
          <Stat label="Untouched" value={untouched.length} accent="muted" />
        </div>

        {/* Sample of next-up letters */}
        {firstNonMastered && (
          <div className="mt-5 px-4 py-3 rounded-xl bg-sb-surface border border-sb-border">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-sb-muted">
              Next up
            </p>
            <p className="mt-1 font-mono text-sb-ink">
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
                bg-sb-ink text-white font-mono uppercase tracking-[0.18em] text-sm
                hover:bg-sb-ink/85 transition-colors duration-200
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
              bg-sb-surface text-sb-ink font-mono uppercase tracking-[0.18em] text-sm
              border border-sb-border
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
  accent,
}: {
  label: string;
  value: number;
  accent: "basil" | "accent" | "muted";
}) {
  const colorClass =
    accent === "basil"
      ? "text-basil-700"
      : accent === "accent"
        ? "text-sb-accent-deep"
        : "text-sb-muted";

  return (
    <div className="rounded-xl bg-sb-surface px-3 py-3 text-center">
      <p className={`font-mono font-bold text-2xl ${colorClass}`}>{value}</p>
      <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-sb-muted">
        {label}
      </p>
    </div>
  );
}
