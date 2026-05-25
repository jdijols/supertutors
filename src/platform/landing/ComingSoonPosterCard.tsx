import { motion } from "framer-motion";

/**
 * ComingSoonPosterCard — placeholder lesson poster used for lessons that
 * route to the ComingSoonMount stub. Shares the structural language of
 * FreddyPosterCard (eyebrow row, center-left title, bottom meta strip)
 * but swaps Freddy's character art for an oversized background glyph
 * and shows a "Coming Soon" eyebrow + corner ribbon.
 *
 * Distinct theme palettes per lesson keep the three carousel cards
 * visually identifiable at a glance.
 */

export type PosterTheme = {
  /** Inline CSS background — gradient or radial. Applied to the base layer. */
  background: string;
  /** Accent color used for the "COMING SOON" eyebrow and ribbon. */
  accent: string;
  /** Color for the giant background glyph (very low opacity). */
  glyphColor: string;
};

export const acutisTheme: PosterTheme = {
  background:
    "radial-gradient(ellipse at 75% 80%, #F0E4D0 0%, #E8DCC1 50%, #F5EFE2 100%)",
  accent: "#7E3A17",
  glyphColor: "#7E3A17",
};

export const aslTheme: PosterTheme = {
  background:
    "radial-gradient(ellipse at 75% 80%, #D5E5F2 0%, #BFD5EB 50%, #EAF3FA 100%)",
  accent: "#1A2237",
  glyphColor: "#1A2237",
};

export function ComingSoonPosterCard({
  className,
  onActivate,
  lessonNumber,
  title,
  titleOutlined,
  tutorName,
  tutorTagline,
  metaStrip,
  glyph,
  theme,
  ariaLabel,
  available = false,
  progress,
}: {
  className?: string;
  onActivate?: () => void;
  lessonNumber: string;
  title: string;
  titleOutlined: string;
  tutorName: string;
  tutorTagline: string;
  metaStrip: string;
  glyph: React.ReactNode;
  theme: PosterTheme;
  ariaLabel: string;
  /** When true: hide Coming Soon ribbon, show "Start" affordance, bump glyph contrast. */
  available?: boolean;
  /** Optional progress overlay rendered inside the card's bottom area. */
  progress?: { mastered: number; total: number };
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
      <div className="absolute inset-0" style={{ background: theme.background }} />

      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      {/* Diagonal "COMING SOON" corner ribbon, top-right — hidden when card represents an available lesson. */}
      {!available && (
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[180px] h-[180px] overflow-hidden pointer-events-none"
        >
          <div
            className="absolute font-mono font-bold uppercase tracking-[0.28em] text-white text-[10px] sm:text-[11px] flex items-center justify-center"
            style={{
              background: theme.accent,
              transform: "rotate(45deg)",
              top: "32px",
              right: "-44px",
              width: "200px",
              height: "26px",
            }}
          >
            Coming Soon
          </div>
        </div>
      )}

      <div className="relative h-full min-h-[420px] md:min-h-[520px]">
        {/* Oversized background glyph — anchored right. Bump opacity for
            available lessons so the glyph reads as character art, not
            decoration. Coming-soon lessons stay faded to signal "not yet". */}
        <div
          aria-hidden
          className={`absolute right-[-4%] sm:right-[-2%] bottom-[10%] w-[55%] h-[70%] flex items-center justify-center transition-transform duration-500 ease-out group-hover:translate-y-[-4px] ${
            available ? "opacity-[0.35]" : "opacity-[0.18]"
          }`}
          style={{ color: theme.glyphColor }}
        >
          {glyph}
        </div>

        {/* Top eyebrow — left side only; the diagonal ribbon handles the
            "Coming soon" affordance on the right and would otherwise
            clip the text. */}
        <div className="absolute top-7 sm:top-9 md:top-10 left-7 sm:left-10 md:left-12 right-7 sm:right-10 md:right-12">
          <span
            className="font-mono text-[11px] uppercase tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            {lessonNumber}
          </span>
        </div>

        {/* Center-left title block */}
        <div className="absolute left-7 sm:left-10 md:left-12 top-1/2 -translate-y-1/2 max-w-[58%] sm:max-w-[56%] md:max-w-[54%] lg:max-w-[58%]">
          <h2 className="font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-ink text-[28px] sm:text-[36px] md:text-[40px] lg:text-[60px]">
            <span className="block">{title}</span>
            <span className="block" style={outlineStyle}>
              {titleOutlined}
            </span>
          </h2>
          <p className="mt-3 text-[13px] sm:text-[14px] lg:text-[15px] text-sb-muted">
            with{" "}
            <span className="text-sb-ink font-medium">{tutorName}</span>. {tutorTagline}
          </p>
        </div>

        {/* Bottom meta strip — progress sits above the divider when present. */}
        <div className="absolute bottom-0 left-0 right-0 px-7 sm:px-10 md:px-12 pb-6 sm:pb-7 md:pb-8">
          {progress && progress.total > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-1 rounded-full bg-sb-ink/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((progress.mastered / progress.total) * 100)}%`,
                    background: theme.accent,
                  }}
                />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-muted whitespace-nowrap">
                {progress.mastered}/{progress.total} mastered
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 border-t border-sb-ink/10 pt-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              {metaStrip}
            </span>
            <span
              aria-hidden
              className={`font-mono text-[12px] uppercase tracking-[0.18em] inline-flex items-center gap-2 group-hover:gap-3 transition-[gap] duration-300 ${
                available ? "text-sb-ink" : "text-sb-ink/60"
              }`}
            >
              {available ? "Start" : "Preview"}
              <span>→</span>
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ---------- Glyphs ---------- */

export function LaurelGlyph() {
  // Classical laurel wreath — pure SVG so it scales cleanly at any size.
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
      {/* Left branch */}
      <path d="M70 30 Q40 100 70 170" />
      <path d="M68 50 Q50 55 45 70" />
      <path d="M64 70 Q44 75 38 90" />
      <path d="M62 92 Q40 95 34 112" />
      <path d="M64 115 Q42 118 38 135" />
      <path d="M68 138 Q48 142 46 158" />
      {/* Right branch */}
      <path d="M130 30 Q160 100 130 170" />
      <path d="M132 50 Q150 55 155 70" />
      <path d="M136 70 Q156 75 162 90" />
      <path d="M138 92 Q160 95 166 112" />
      <path d="M136 115 Q158 118 162 135" />
      <path d="M132 138 Q152 142 154 158" />
      {/* Top tie */}
      <path d="M70 30 Q100 18 130 30" />
      {/* Bottom tie + ribbon */}
      <path d="M70 170 Q100 182 130 170" />
      <path d="M92 178 L88 198" />
      <path d="M108 178 L112 198" />
    </svg>
  );
}

export function SignHandGlyph() {
  // Open hand "stop / hello" pose — universal ASL teaching icon.
  return (
    <svg
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* Palm */}
      <path d="M60 110 Q60 80 75 70 L75 50 Q75 35 90 35 Q105 35 105 50 L105 75" />
      {/* Index */}
      <path d="M105 75 L105 35 Q105 20 118 20 Q131 20 131 35 L131 80" />
      {/* Middle */}
      <path d="M131 80 L131 30 Q131 17 144 17 Q157 17 157 30 L157 85" />
      {/* Ring + thumb side curve */}
      <path d="M157 85 L157 40 Q157 27 170 27 Q183 27 183 40 L183 100 Q183 145 150 170 Q120 188 95 180 Q70 172 60 150 Q52 135 60 110" />
      {/* Thumb */}
      <path d="M60 130 Q40 130 35 145 Q30 160 45 168" />
    </svg>
  );
}
