export function AboutCard({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink ${className ?? ""}`}
    >
      <div className="relative h-full min-h-[280px] md:min-h-[340px] px-7 sm:px-9 flex flex-col justify-between py-7 sm:py-9">
        {/* Eyebrow */}
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-paper/60">
          About
        </span>

        {/* Main content */}
        <div>
          <h2 className="font-mono font-bold leading-[0.95] tracking-[-0.02em] text-sb-paper-soft text-[22px] sm:text-[26px] md:text-[28px]">
            Tutors for the AI generation.
          </h2>
          <p className="mt-4 text-[13px] sm:text-[14px] text-sb-paper-soft/70 max-w-[44ch] leading-relaxed font-sans">
            SuperTutors pairs kids with AI-native lesson experiences designed to
            feel like play — not class. One tutor, one subject, one deliberate
            moment of learning at a time.
          </p>
        </div>

        {/* Footer */}
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-paper/40">
          A SuperBuilders project
        </span>
      </div>
    </div>
  );
}
