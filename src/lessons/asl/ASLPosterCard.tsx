import { motion } from "framer-motion";

export function ASLPosterCard({
  className,
  onActivate,
  ariaLabel = "Start the ASL lesson",
}: {
  className?: string;
  onActivate?: () => void;
  ariaLabel?: string;
}) {
  const outlineStyle: React.CSSProperties = {
    WebkitTextStrokeWidth: "1px",
    WebkitTextStrokeColor: "#1A2237",
    WebkitTextFillColor: "transparent",
    paintOrder: "stroke fill",
  };

  return (
    <motion.button
      onClick={onActivate}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={`group relative overflow-hidden rounded-[22px] border border-white/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink w-full h-full ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      {/* Sky gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 75% 80%, #D5E5F2 0%, #BFD5EB 50%, #EAF3FA 100%)",
        }}
      />

      {/* Hatch texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      {/* Soft halo behind Sage — same character-presence treatment
          as Freddy. Her feet extend below the hairline. */}
      <div
        aria-hidden
        className="absolute right-[4.5%] sm:right-[6.5%] md:right-[8.5%] top-[28%] w-[44%] h-[76%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(26,34,55,0.10)_0%,rgba(26,34,55,0)_70%)]"
      />
      <img
        src="/lessons/asl/images/characters/sage/saluting-start.png"
        alt="Sage"
        className="absolute right-[2.5%] sm:right-[4.5%] md:right-[6.5%] -bottom-[171px] sm:-bottom-[181px] md:-bottom-[200px] h-[152%] max-h-[726px] w-auto max-w-[57%] sm:max-w-[55%] md:max-w-[53%] lg:max-w-[57%] object-contain object-bottom drop-shadow-[0_24px_36px_rgba(26,34,55,0.25)] transition-transform duration-500 ease-out group-hover:translate-y-[-4px]"
      />

      <div className="relative h-full min-h-[280px] md:min-h-[340px]">
        {/* Eyebrow row */}
        <div className="absolute top-7 sm:top-9 md:top-10 left-7 sm:left-10 md:left-12 right-7 sm:right-10 md:right-12 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="h-px w-6 bg-[#1A2237]/60" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#1A2237]">
              Lesson 02
            </span>
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
            ~15 min
          </span>
        </div>

        {/* Title block */}
        <div className="absolute left-7 sm:left-10 md:left-12 top-1/2 -translate-y-1/2 max-w-[58%] sm:max-w-[58%] md:max-w-[56%] lg:max-w-[65%]">
          <h2 className="font-mono font-bold leading-[0.95] tracking-normal text-sb-ink text-[28px] sm:text-[36px] md:text-[40px] lg:text-[60px]">
            <span className="block">Learn</span>
            <span className="block" style={outlineStyle}>
              AMERICAN
            </span>
            <span className="block" style={outlineStyle}>
              SIGN LANGUAGE
            </span>
          </h2>
          <p className="mt-3 text-[13px] sm:text-[14px] lg:text-[15px] text-sb-muted">
            with <span className="text-sb-ink font-medium">Sage</span> and your
            camera right at home.
          </p>
        </div>

        {/* Bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 px-7 sm:px-10 md:px-12 pb-6 sm:pb-7 md:pb-8">
          <div className="flex items-center justify-between gap-4 border-t border-sb-ink/10 pt-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              Camera · Hand · Sign
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
