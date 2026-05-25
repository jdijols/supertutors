import { motion } from "framer-motion";

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
      aria-label="Read the Acutis Institute BrainLift research brief"
    >
      {/* Parchment gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 40%, #F5EFE2 0%, #EFE7DA 60%, #E8DECC 100%)",
        }}
      />

      {/* Subtle paper-grain texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      {/* Background scroll glyph — anchored bottom-right */}
      <div
        aria-hidden
        className="absolute right-[-4%] bottom-[10%] w-[55%] h-[60%] flex items-center justify-center opacity-[0.12] transition-transform duration-500 ease-out group-hover:translate-y-[-4px] text-sb-accent-deep"
      >
        <ScrollGlyph />
      </div>

      <div className="relative h-full min-h-[280px] md:min-h-[340px]">
        {/* Eyebrow */}
        <div className="absolute top-7 sm:top-9 left-7 sm:left-9">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
            BrainLift
          </span>
        </div>

        {/* Title block */}
        <div className="absolute left-7 sm:left-9 top-1/2 -translate-y-1/2 max-w-[80%]">
          <h2 className="font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-ink text-[22px] sm:text-[28px] md:text-[32px]">
            <span className="block">Acutis</span>
            <span className="block" style={outlineStyle}>
              INSTITUTE
            </span>
          </h2>
          <p className="mt-3 text-[12px] sm:text-[13px] text-sb-muted max-w-[30ch]">
            A research brief on autonomous AI tutoring.
          </p>
        </div>

        {/* Bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 px-7 sm:px-9 pb-6 sm:pb-7">
          <div className="flex items-center justify-between gap-4 border-t border-sb-ink/10 pt-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              Research
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

function ScrollGlyph() {
  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Scroll body */}
      <rect x="40" y="30" width="120" height="150" rx="8" />
      {/* Top and bottom scroll rolls */}
      <ellipse cx="100" cy="30" rx="20" ry="10" />
      <ellipse cx="100" cy="180" rx="20" ry="10" />
      {/* Text lines on scroll */}
      <line x1="60" y1="65" x2="140" y2="65" />
      <line x1="60" y1="85" x2="140" y2="85" />
      <line x1="60" y1="105" x2="120" y2="105" />
      <line x1="60" y1="125" x2="130" y2="125" />
      <line x1="60" y1="145" x2="110" y2="145" />
    </svg>
  );
}
