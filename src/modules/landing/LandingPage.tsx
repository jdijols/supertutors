import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SuperTutorsLockup } from "./SuperTutorsLockup";
import { lessons } from "@/platform/registry";

export function LandingPage() {
  const navigate = useNavigate();
  // Registry-driven: Freddy is always lessons[0]. Additional lessons will
  // render as TutorCards once Phase 3.2 stubs land.
  const freddy = lessons[0];

  return (
    <main className="h-[100dvh] w-full bg-sb-surface font-sans text-sb-ink antialiased flex flex-col">
      <div className="mx-auto w-full max-w-[1280px] flex-1 min-h-0 flex flex-col gap-4 sm:gap-5 md:gap-6 px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
        {/* 1. Banner — single-line wordmark, compact vertical */}
        <section
          aria-label="SuperTutors banner"
          className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] bg-sb-ink text-white px-5 sm:px-8 md:px-12 py-5 sm:py-7 md:py-9 shrink-0"
        >
          <SuperTutorsLockup variant="onDark" size="lg" />
        </section>

        {/* 2 + 3. Bento pair — 2:3 ratio, flexes to fill viewport */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-5 md:gap-6 flex-1 min-h-0">
          <AboutCard className="md:col-span-2" />
          <FreddyPosterCard
            className="md:col-span-3"
            ariaLabel={
              freddy
                ? `Start the ${freddy.meta.subject.toLowerCase()} lesson with ${freddy.meta.tutorName}`
                : "Start the fractions lesson with Freddy"
            }
            onActivate={() => navigate(freddy ? `/lessons/${freddy.slug}` : "/lessons/freddy-fractions")}
          />
        </div>
      </div>
    </main>
  );
}

function AboutCard({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="about-heading"
      className={`group rounded-[22px] bg-sb-card border border-sb-border p-7 sm:p-9 md:p-10 flex flex-col justify-between min-h-0 ${className ?? ""}`}
    >
      <div>
        <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-sb-muted mb-5">
          About
        </p>
        <h2
          id="about-heading"
          className="font-mono font-bold text-[28px] sm:text-[32px] md:text-[36px] leading-[1.02] tracking-[-0.02em] text-sb-ink"
        >
          Tutors for the AI generation.
        </h2>
        <p className="mt-5 text-[15px] sm:text-base leading-[1.55] text-sb-muted max-w-[42ch]">
          One subject. One expert. One friend at a time. SuperTutors are built
          ground-up for kids who will grow up alongside intelligent machines —
          designed to earn their attention and reward their curiosity.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted mb-3">
            Coming next
          </p>
          <ul className="flex flex-wrap gap-2">
            {["Reading", "Science", "Writing", "Music"].map((subject) => (
              <li
                key={subject}
                className="font-mono text-[12px] sm:text-[13px] px-3 py-1.5 rounded-full border border-sb-border text-sb-ink bg-sb-surface"
              >
                {subject}
              </li>
            ))}
          </ul>
        </div>
        <p className="pt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-sb-ink/70">
          A SuperBuilders project
        </p>
      </div>
    </section>
  );
}

function FreddyPosterCard({
  className,
  onActivate,
  ariaLabel = "Start the fractions lesson with Freddy",
}: {
  className?: string;
  onActivate?: () => void;
  ariaLabel?: string;
}) {
  // Same outline treatment as the banner — paint-order + thin stroke keeps
  // doubled-contour artifacts to a minimum without losing the outlined look.
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
      className={`group relative overflow-hidden rounded-[22px] border border-sb-border bg-sb-card text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface min-h-0 ${className ?? ""}`}
      aria-label={ariaLabel}
    >
      {/* Warm tonal background — gradient now centered on Freddy's new
          right-side anchor so the warmth radiates outward from the character. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_80%,#F1E5D0_0%,#EFE7DA_50%,#F5F2EC_100%)]" />

      {/* Subtle grain / paper hatch */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      {/* Card uses absolute positioning so Freddy occupies the right column
          while the original top eyebrow row + bottom meta strip stay in
          place; only the title text drops to the bottom-left. */}
      <div className="relative h-full min-h-[420px] md:min-h-[520px]">
        {/* Top eyebrow row — LESSON 01 (left) + ~5 MIN (right) */}
        <div className="absolute top-7 sm:top-9 md:top-10 left-7 sm:left-10 md:left-12 right-7 sm:right-10 md:right-12 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
            Lesson 01
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
            ~5 min
          </span>
        </div>

        {/* Freddy — right-anchored, larger. max-w cap keeps him from
            bleeding into the title column on portrait iPad. */}
        <div
          aria-hidden
          className="absolute right-[2%] sm:right-[4%] bottom-[58px] sm:bottom-[64px] md:bottom-[72px] w-[55%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(26,26,26,0.10)_0%,rgba(26,26,26,0)_70%)]"
        />
        <img
          src="/images/characters/freddy/facing-student-excited-open.png"
          alt="Freddy Fractions"
          className="absolute right-[-2%] sm:right-0 md:right-[2%] bottom-[56px] sm:bottom-[64px] md:bottom-[72px] h-[80%] max-h-[560px] w-auto max-w-[55%] sm:max-w-[58%] md:max-w-[58%] lg:max-w-[65%] object-contain object-bottom drop-shadow-[0_24px_36px_rgba(26,26,26,0.25)] transition-transform duration-500 ease-out group-hover:translate-y-[-4px]"
        />

        {/* Center-left title block — JUST the headline + subtitle.
            Vertically centered so "FRACTIONS" lines up roughly with
            Freddy's armpit (the natural visual center). */}
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

        {/* Bottom meta strip — PIZZA · SLICER · GLOVE (left) + START → (right) */}
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
