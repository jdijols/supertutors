import { motion } from "framer-motion";

/**
 * BrainliftCard — research/biography poster for the Saint Carlo Acutis
 * Institute BrainLift. Light surface intentionally contrasts the dark
 * AboutCard on the same landing surface, balancing the bento's color
 * weight. The Acutis portrait sits behind the title on the right and
 * fades into the card via a linear gradient.
 */
export function BrainliftCard({
  onActivate,
  className,
}: {
  onActivate: () => void;
  className?: string;
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
      className={`group relative overflow-hidden rounded-[22px] border border-white/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink w-full h-full ${className ?? ""}`}
      aria-label="Read the Saint Carlo Acutis Institute BrainLift research brief"
    >
      {/* Light paper base — warm off-white, intentionally contrasts AboutCard's dark surface */}
      <div className="absolute inset-0 bg-sb-paper-soft" />

      {/* Carlo Acutis portrait — right-anchored, fills card height */}
      <img
        src="/lessons/acutis/images/carlo-acutis.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none select-none absolute right-0 top-0 h-full w-auto object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.015]"
      />

      {/* Linear gradient — fades paper (left) into transparent over the portrait (right) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, #F5F2EC 0%, #F5F2EC 38%, rgba(245,242,236,0.92) 52%, rgba(245,242,236,0.55) 68%, rgba(245,242,236,0) 88%)",
        }}
      />

      {/* Subtle paper-grain texture for tactile warmth */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      {/* Halo wash behind title — gives the lettering a quiet luminance */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[58%]"
        style={{
          background:
            "radial-gradient(ellipse at 25% 55%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Bottom fade — keeps the meta strip on clean paper, photo melts away */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-[72px] sm:h-[80px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(245,242,236,0) 0%, rgba(245,242,236,0.7) 40%, #F5F2EC 75%)",
        }}
      />

      <div className="relative h-full min-h-[280px] md:min-h-[340px]">
        {/* Eyebrow */}
        <div className="absolute top-7 sm:top-9 left-7 sm:left-9 flex items-center gap-2">
          <span className="h-px w-6 bg-sb-accent-deep/60" aria-hidden />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
            BrainLift
          </span>
        </div>

        {/* Title block */}
        <div className="absolute left-7 sm:left-9 top-1/2 -translate-y-1/2 max-w-[62%]">
          <span className="block font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.28em] text-sb-accent-deep mb-2">
            Saint Carlo
          </span>
          <h2 className="font-mono font-bold leading-[0.92] tracking-[-0.02em] text-sb-ink text-[30px] sm:text-[36px] md:text-[42px]">
            <span className="block">Acutis</span>
            <span className="block" style={outlineStyle}>
              INSTITUTE
            </span>
          </h2>
          <p className="mt-4 text-[13px] sm:text-[14px] text-sb-muted max-w-[28ch] leading-relaxed font-sans">
            A research brief on a Catholic vertical for{" "}
            <a
              href="https://superbuilders.dev"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sb-ink font-medium underline-offset-[3px] decoration-sb-ink/40 hover:underline hover:decoration-sb-ink focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-paper-soft rounded-sm transition-colors duration-200"
            >
              Superbuilders
            </a>
            , named for the patron saint of the internet.
          </p>
        </div>

        {/* Bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 px-7 sm:px-9 pb-6 sm:pb-7">
          <div className="flex items-center justify-between gap-4 border-t border-sb-ink/10 pt-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              Research · Living doc
            </span>
            <span
              aria-hidden
              className="font-mono text-[12px] uppercase tracking-[0.18em] text-sb-ink inline-flex items-center gap-2 group-hover:gap-3 transition-[gap] duration-300"
            >
              Read brief
              <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
