import { motion } from "framer-motion";

export function AboutCard({
  onActivate,
  className,
}: {
  onActivate: () => void;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onActivate}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={`group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink w-full h-full ${className ?? ""}`}
      aria-label="Read how I build — my AI workflow"
    >
      {/* Faint diagonal hatch — top-left to bottom-right, white on dark
          surface so the lines are visible. Matches BrainliftCard's
          direction; lesson cards run the other way. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #FFFFFF 0 1px, transparent 1px 8px)",
        }}
      />

      <div className="relative h-full min-h-[280px] md:min-h-[340px] px-7 sm:px-9 flex flex-col justify-between py-7 sm:py-9">
        {/* Eyebrow */}
        <span className="flex items-center gap-2">
          <span className="h-px w-6 bg-sb-paper/40" aria-hidden />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-paper/60">
            About
          </span>
        </span>

        {/* Main content */}
        <div>
          <h2 className="font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-paper-soft text-[22px] sm:text-[26px] md:text-[28px]">
            Tutors for the AI generation.
          </h2>
          <p className="mt-4 text-[13px] sm:text-[14px] text-sb-paper-soft/70 max-w-[44ch] leading-relaxed font-sans">
            SuperTutors pairs kids with AI-native lesson experiences designed to
            feel like play, not class. One tutor, one subject, one deliberate
            moment of learning at a time.
          </p>
        </div>

        {/* Bottom strip — meta on left, click affordance on right.
            The whole card is the navigation target; the Jason Dijols
            link is the one carved-out exception (stops propagation so
            clicking it opens LinkedIn instead of /workflow). */}
        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-paper/40">
            A{" "}
            <a
              href="https://linkedin.com/in/jasondijols"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sb-paper/70 underline-offset-[3px] decoration-sb-paper/60 hover:underline hover:text-sb-paper focus:outline-none focus-visible:underline focus-visible:text-sb-paper focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink rounded-sm transition-colors duration-200"
            >
              Jason Dijols
            </a>{" "}
            project
          </span>
          <span
            aria-hidden
            className="font-mono text-[12px] uppercase tracking-[0.18em] text-sb-paper-soft inline-flex items-center gap-2 group-hover:gap-3 transition-[gap] duration-300 whitespace-nowrap"
          >
            How I build
            <span>→</span>
          </span>
        </div>
      </div>
    </motion.button>
  );
}
