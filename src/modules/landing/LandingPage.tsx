import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SuperTutorsLockup } from "./SuperTutorsLockup";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen w-full bg-sb-surface font-sans text-sb-ink antialiased">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-10 flex flex-col gap-4 sm:gap-5 md:gap-6">
        {/* 1. Banner */}
        <section
          aria-label="SuperTutors banner"
          className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-sb-ink text-white px-5 sm:px-10 md:px-14 py-8 sm:py-12 md:py-16"
        >
          <SuperTutorsLockup variant="onDark" size="lg" />
        </section>

        {/* 2 + 3. Bento pair */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
          {/* About + roadmap */}
          <AboutCard className="md:col-span-2" />
          {/* Freddy CTA — Apple TV+ poster */}
          <FreddyPosterCard
            className="md:col-span-3"
            onActivate={() => navigate("/lesson")}
          />
        </div>

        <footer className="px-2 py-2 flex items-center justify-between text-sb-muted text-xs font-sans">
          <span>SuperTutors — a SuperBuilders project</span>
          <span className="font-mono tracking-tight">v0.1 · edu/acc</span>
        </footer>
      </div>
    </main>
  );
}

function AboutCard({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="about-heading"
      className={`group rounded-[24px] bg-sb-card border border-sb-border p-7 sm:p-9 md:p-10 flex flex-col justify-between min-h-[360px] md:min-h-[460px] ${className ?? ""}`}
    >
      <div>
        <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.18em] text-sb-muted mb-5">
          About
        </p>
        <h2
          id="about-heading"
          className="font-mono font-bold text-[28px] sm:text-[34px] md:text-[40px] leading-[1.02] tracking-[-0.02em] text-sb-ink"
        >
          Tutors for the AI generation.
        </h2>
        <p className="mt-5 text-[15px] sm:text-base leading-[1.55] text-sb-muted max-w-[42ch]">
          One subject. One expert. One friend at a time. SuperTutors are built
          ground-up for kids who will grow up alongside intelligent machines —
          designed to earn their attention and reward their curiosity.
        </p>
      </div>

      <div className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted mb-3">
          Coming next
        </p>
        <ul className="flex flex-wrap gap-2">
          {["Reading", "Science", "Writing", "Music"].map((subject) => (
            <li
              key={subject}
              className="font-mono text-[12px] sm:text-[13px] px-3 py-1.5 rounded-full border border-sb-border text-sb-muted bg-sb-surface"
            >
              {subject}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FreddyPosterCard({
  className,
  onActivate,
}: {
  className?: string;
  onActivate?: () => void;
}) {
  return (
    <motion.button
      onClick={onActivate}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className={`group relative overflow-hidden rounded-[24px] border border-sb-border bg-sb-card text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface ${className ?? ""}`}
      aria-label="Start the fractions lesson with Freddy"
    >
      {/* Warm tonal background — restrained champagne gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_85%,#F1E5D0_0%,#EFE7DA_55%,#F5F2EC_100%)]" />

      {/* Subtle grain / paper hatch */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      <div className="relative flex flex-col min-h-[420px] md:min-h-[520px]">
        {/* Top text block */}
        <div className="px-7 sm:px-10 md:px-12 pt-7 sm:pt-9 md:pt-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-accent-deep">
              Lesson 01
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              ~5 min
            </span>
          </div>

          <h2 className="mt-4 font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-ink text-[40px] sm:text-[52px] md:text-[64px]">
            <span className="block">Learn</span>
            <span
              className="block"
              style={{
                WebkitTextStroke: "1.5px #1A1A1A",
                color: "transparent",
              }}
            >
              FRACTIONS
            </span>
          </h2>

          <p className="mt-3 text-[15px] sm:text-base text-sb-muted">
            with{" "}
            <span className="text-sb-ink font-medium">Freddy Fractions</span>{" "}
            at SuperSlice Pizza.
          </p>
        </div>

        {/* Visual: Freddy alone, framed like a movie poster */}
        <div className="relative flex-1 mt-2 min-h-[260px] md:min-h-[320px]">
          {/* Soft spotlight behind Freddy */}
          <div
            aria-hidden
            className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[78%] h-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(26,26,26,0.10)_0%,rgba(26,26,26,0)_70%)]"
          />
          <img
            src="/images/characters/freddy/facing-student-excited-open.png"
            alt="Freddy Fractions"
            className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[100%] w-auto object-contain object-bottom drop-shadow-[0_24px_30px_rgba(26,26,26,0.22)] transition-transform duration-500 ease-out group-hover:translate-y-[-4px]"
          />
        </div>

        {/* Bottom meta strip */}
        <div className="relative px-7 sm:px-10 md:px-12 pb-6 sm:pb-7 md:pb-8">
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
