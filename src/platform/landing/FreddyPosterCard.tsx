import { motion } from "framer-motion";

/**
 * FreddyPosterCard — the hero lesson poster for "Learn Fractions" with
 * Freddy. Extracted from LandingPage so the carousel can render all
 * three lesson posters side-by-side without LandingPage owning the art.
 */
export function FreddyPosterCard({
  className,
  onActivate,
  ariaLabel = "Start the fractions lesson with Freddy",
}: {
  className?: string;
  onActivate?: () => void;
  ariaLabel?: string;
}) {
  const outlineStyle: React.CSSProperties = {
    WebkitTextStrokeWidth: "1px",
    WebkitTextStrokeColor: "#1A1A1A",
    WebkitTextFillColor: "transparent",
    paintOrder: "stroke fill",
  };

  return (
    <motion.button
      onClick={onActivate}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={`group relative overflow-hidden rounded-[22px] border border-sb-border bg-sb-card text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface w-full h-full ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_80%,#F1E5D0_0%,#EFE7DA_50%,#F5F2EC_100%)]" />

      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      <div className="relative h-full min-h-[420px] md:min-h-[520px]">
        <div className="absolute top-7 sm:top-9 md:top-10 left-7 sm:left-10 md:left-12 right-7 sm:right-10 md:right-12 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
            Lesson 01
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
            ~5 min
          </span>
        </div>

        <div
          aria-hidden
          className="absolute right-[2%] sm:right-[4%] bottom-[58px] sm:bottom-[64px] md:bottom-[72px] w-[55%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(26,26,26,0.10)_0%,rgba(26,26,26,0)_70%)]"
        />
        <img
          src="/lessons/freddy-fractions/images/characters/freddy/facing-student-excited-open.png"
          alt="Freddy Fractions"
          className="absolute right-[-2%] sm:right-0 md:right-[2%] bottom-[56px] sm:bottom-[64px] md:bottom-[72px] h-[80%] max-h-[560px] w-auto max-w-[55%] sm:max-w-[58%] md:max-w-[58%] lg:max-w-[65%] object-contain object-bottom drop-shadow-[0_24px_36px_rgba(26,26,26,0.25)] transition-transform duration-500 ease-out group-hover:translate-y-[-4px]"
        />

        <div className="absolute left-7 sm:left-10 md:left-12 top-1/2 -translate-y-1/2 max-w-[44%] sm:max-w-[44%] md:max-w-[42%] lg:max-w-[58%]">
          <h2 className="font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-ink text-[28px] sm:text-[36px] md:text-[40px] lg:text-[60px]">
            <span className="block">Learn</span>
            <span className="block" style={outlineStyle}>
              FRACTIONS
            </span>
          </h2>
          <p className="mt-3 text-[13px] sm:text-[14px] lg:text-[15px] text-sb-muted">
            with{" "}
            <span className="text-sb-ink font-medium">Freddy Fractions</span>{" "}
            at SuperSlice Pizza.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-7 sm:px-10 md:px-12 pb-6 sm:pb-7 md:pb-8">
          <div className="flex items-center justify-between gap-4 border-t border-sb-ink/10 pt-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              Pizza · Slicer · Glove
            </span>
            <span
              aria-hidden
              className="font-mono text-[12px] uppercase tracking-[0.18em] text-sb-ink inline-flex items-center gap-2 group-hover:gap-3 transition-[gap] duration-300"
            >
              Start
              <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
