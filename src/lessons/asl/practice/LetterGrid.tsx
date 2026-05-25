import { useAslStore } from "../store/aslStore";
import { getTrainedSigns } from "../vocab";

/**
 * The model's most-confused letter pairs (from the alphabet holdout
 * confusion matrix). These get surfaced as dedicated drill cards.
 */
const CONFUSION_PAIRS: { pair: [string, string]; label: string; tip: string }[] = [
  { pair: ["M", "N"], label: "M vs N", tip: "Thumb under 3 fingers vs 2" },
  { pair: ["U", "V"], label: "U vs V", tip: "Fingers together vs apart" },
  { pair: ["I", "J"], label: "I vs J", tip: "Pinky up vs pinky tracing a hook" },
  { pair: ["S", "T"], label: "S vs T", tip: "Thumb in front vs between fingers" },
];

/**
 * LetterGrid — default-entry dashboard for the ASL lesson.
 *
 * Renders as an overlay on top of the live camera feed. Each letter shows
 * its current mastery state (mastered ✓ / attempted ◐ / untouched ○).
 * Tapping a tile enters practice mode for that letter.
 *
 * Also renders a "Confusion-pair drill" section if any of the model's
 * known-hard pairs (M/N, U/V, I/J, S/T) have at least one attempted letter
 * — surfaces dedicated drills for those.
 */
export function LetterGrid({ onEndSession }: { onEndSession: () => void }) {
  const outcomes = useAslStore((s) => s.outcomes);
  const selectSign = useAslStore((s) => s.selectSign);
  const startDrill = useAslStore((s) => s.startDrill);

  const letters = getTrainedSigns().filter((s) => /^[A-Z]$/.test(s.glyph));

  const masteredCount = letters.filter(
    (l) => outcomes[l.id] === "mastered",
  ).length;
  const attemptedCount = letters.filter(
    (l) => outcomes[l.id] === "attempted",
  ).length;

  return (
    <div
      data-testid="letter-grid"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm p-4 sm:p-8"
    >
      {/* Header card */}
      <div className="w-full max-w-3xl mb-4 sm:mb-6">
        <div className="rounded-2xl bg-sb-card/95 backdrop-blur-md border border-sb-border shadow-xl shadow-black/30 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sb-muted">
              Practice — tap a letter
            </p>
            <p className="font-mono text-base sm:text-lg text-sb-ink mt-1">
              <span className="text-sb-accent-deep">{masteredCount}</span>
              {" mastered · "}
              <span className="text-sb-ink">{attemptedCount}</span>
              {" attempted · "}
              <span className="text-sb-muted">
                {letters.length - masteredCount - attemptedCount}
              </span>
              {" to go"}
            </p>
          </div>
          <button
            type="button"
            onClick={onEndSession}
            className="
              shrink-0 px-3 py-2 rounded-xl
              font-mono text-[10px] uppercase tracking-[0.18em]
              bg-sb-surface text-sb-ink border border-sb-border
              hover:bg-sb-paper transition-colors duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-card
            "
          >
            End session
          </button>
        </div>
      </div>

      {/* Letter tile grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-2 sm:gap-3 w-full max-w-3xl">
        {letters.map((letter) => {
          const outcome = outcomes[letter.id];
          return (
            <LetterTile
              key={letter.id}
              glyph={letter.glyph}
              outcome={outcome}
              onClick={() => selectSign(letter.id)}
            />
          );
        })}
      </div>

      {/* Confusion-pair drills */}
      <div className="w-full max-w-3xl mt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70 mb-2 px-1">
          Tricky pairs — drill until you nail 4 in a row
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {CONFUSION_PAIRS.map(({ pair, label, tip }) => (
            <DrillCard
              key={label}
              label={label}
              tip={tip}
              onClick={() => startDrill(pair)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DrillCard({
  label,
  tip,
  onClick,
}: {
  label: string;
  tip: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`drill-card-${label.replace(/\s/g, "")}`}
      className="
        text-left rounded-2xl px-3 py-3
        bg-sb-card/85 border border-sb-border
        hover:bg-sb-card hover:border-sb-ink transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black
      "
    >
      <p className="font-mono font-bold text-sb-ink text-base">{label}</p>
      <p className="font-sans text-xs text-sb-muted leading-snug mt-0.5">
        {tip}
      </p>
    </button>
  );
}

function LetterTile({
  glyph,
  outcome,
  onClick,
}: {
  glyph: string;
  outcome: "mastered" | "attempted" | undefined;
  onClick: () => void;
}) {
  const mastered = outcome === "mastered";
  const attempted = outcome === "attempted";

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`letter-tile-${glyph}`}
      aria-label={`Practice the letter ${glyph}${mastered ? ", mastered" : attempted ? ", attempted" : ""}`}
      className={`
        aspect-square rounded-2xl
        flex flex-col items-center justify-center
        font-mono font-bold text-3xl sm:text-4xl
        border-2 transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black
        ${
          mastered
            ? "bg-basil-400/90 border-basil-400 text-sb-ink shadow-lg shadow-basil-400/30 hover:bg-basil-400"
            : attempted
              ? "bg-sb-card/90 border-sb-accent text-sb-ink hover:bg-sb-card"
              : "bg-sb-card/80 border-sb-border text-sb-ink hover:bg-sb-card hover:border-sb-ink"
        }
      `}
    >
      <span>{glyph}</span>
      <span
        aria-hidden
        className={`mt-1 text-[10px] font-normal tracking-[0.18em] ${
          mastered ? "text-sb-ink/70" : attempted ? "text-sb-muted" : "text-sb-muted/50"
        }`}
      >
        {mastered ? "✓" : attempted ? "◐" : "○"}
      </span>
    </button>
  );
}
