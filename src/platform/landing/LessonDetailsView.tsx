import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { MasteryEntry } from "@/platform/progress/types";

export interface LessonCatalogItem {
  /** Stable item ID matching the `items` table, e.g. "asl:A". */
  id: string;
  /** Display glyph or short label rendered inside the pill. */
  label: string;
  /** Optional long-form description — surfaces as the pill tooltip. */
  description?: string;
}

export interface LessonCTA {
  /** Button label, e.g. "Start lesson". */
  label: string;
  /** Click handler. */
  onClick: () => void;
}

interface LessonDetailsViewProps {
  /** Lesson slug — used to apply per-lesson styling. */
  slug: "asl" | "freddy-fractions";
  /** Eyebrow text (e.g. "LESSON 02") rendered above the title. */
  eyebrow: string;
  /** Estimated time-to-complete string, e.g. "~15 min". */
  durationLabel: string;
  /** Hero title block — already line-split by the caller. */
  titleLines: { text: string; outline?: boolean }[];
  /** Subtitle paragraph (e.g. "with Sage and your camera right at home."). */
  subtitle: React.ReactNode;
  /** Mastery entries for this lesson. */
  mastery: MasteryEntry[];
  /** Full lesson item catalog. Drives the by-item grid + denominator. */
  catalog: LessonCatalogItem[];
  /** Meta strip text, e.g. "Camera · Hand · Sign". */
  metaLabel: string;
  /** Called when the user dismisses the view (×, Esc, backdrop click). */
  onClose: () => void;
  /** Primary CTA (e.g. "Start lesson"). */
  primaryCta: LessonCTA;
  /** Optional secondary CTA (e.g. "Explore sandbox") rendered to the
   * left of the primary, in a quieter visual treatment. */
  secondaryCta?: LessonCTA;
}

const OUTLINE_STYLE: React.CSSProperties = {
  WebkitTextStrokeWidth: "1px",
  WebkitTextStrokeColor: "#1A1A1A",
  WebkitTextFillColor: "transparent",
  paintOrder: "stroke fill",
};

/**
 * LessonDetailsView — the expanded "details" state of a lesson card.
 *
 * Rendered inside a `motion.div` that shares a `layoutId` with the
 * collapsed card, so framer-motion tweens the size + position between
 * the two. This component is concerned only with the expanded content
 * layout, not the animation choreography.
 */
export function LessonDetailsView({
  slug,
  eyebrow,
  durationLabel,
  titleLines,
  subtitle,
  mastery,
  catalog,
  metaLabel,
  onClose,
  primaryCta,
  secondaryCta,
}: LessonDetailsViewProps) {
  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Indexed lookup so per-item rendering is O(1).
  const masteryById = useMemo(() => {
    const map = new Map<string, MasteryEntry>();
    for (const m of mastery) map.set(m.itemId, m);
    return map;
  }, [mastery]);

  const masteredCount = mastery.filter((m) => m.status === "mastered").length;
  const totalItems = catalog.length;
  const totalAttempts = mastery.reduce(
    (sum, m) => sum + m.passCount + m.failCount,
    0,
  );
  const lastPracticedAt = mastery
    .map((m) => m.lastPracticedAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);

  const lessonBg =
    slug === "asl"
      ? "radial-gradient(ellipse at 75% 80%, #D5E5F2 0%, #BFD5EB 50%, #EAF3FA 100%)"
      : "radial-gradient(ellipse_at_75%_80%,#F1E5D0_0%,#EFE7DA_50%,#F5F2EC_100%)";

  return (
    <div
      className="relative w-full h-full overflow-hidden rounded-[22px] border border-sb-border"
      style={{ background: lessonBg }}
    >
      {/* Hatch texture — matches lesson card direction (135deg) */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, #1A1A1A 0 1px, transparent 1px 8px)",
        }}
      />

      {/* Scrollable inner content. The contents fade in once the
          layoutId tween settles — staggered ~120ms behind the box
          morph so the expanded chrome doesn't fight the motion. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
        className="relative h-full overflow-y-auto"
      >
        <div className="px-8 sm:px-12 md:px-16 py-8 sm:py-10 md:py-12 max-w-[1080px] mx-auto">
          {/* Top row: eyebrow left, duration + close right */}
          <div className="flex items-start justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="h-px w-6 bg-[#1A2237]/60" aria-hidden />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#1A2237]">
                {eyebrow}
              </span>
            </span>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
                {durationLabel}
              </span>
              <CloseButton onClick={onClose} />
            </div>
          </div>

          {/* Hero title */}
          <h2 className="mt-8 font-mono font-bold leading-[0.95] tracking-normal text-sb-ink text-[40px] sm:text-[52px] md:text-[64px] lg:text-[76px]">
            {titleLines.map((line, i) => (
              <span
                key={i}
                className="block"
                style={line.outline ? OUTLINE_STYLE : undefined}
              >
                {line.text}
              </span>
            ))}
          </h2>

          <p className="mt-5 text-[14px] sm:text-[15px] md:text-[16px] text-sb-muted max-w-[60ch] font-sans">
            {subtitle}
          </p>

          {/* Metric tiles */}
          <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-4 max-w-[640px]">
            <MetricTile
              value={`${masteredCount} / ${totalItems}`}
              label="Mastered"
            />
            <MetricTile value={`${totalAttempts}`} label="Attempts" />
            <MetricTile
              value={formatLastPracticed(lastPracticedAt)}
              label="Last practiced"
            />
          </div>

          {/* Progress bar */}
          <div className="mt-8 max-w-[640px]">
            <div className="h-2 rounded-full bg-sb-ink/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-sb-ink/80 transition-all duration-500"
                style={{
                  width:
                    totalItems > 0
                      ? `${Math.round((masteredCount / totalItems) * 100)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              {totalItems > 0
                ? `${Math.round((masteredCount / totalItems) * 100)}% complete`
                : "0% complete"}
            </p>
          </div>

          {/* By-item grid — only if catalog provided. Catalogs with
              few items (Freddy = 5) use a wider pill so the longer
              labels read; ASL's 34-item set uses the dense grid. */}
          {catalog.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-px w-6 bg-sb-ink/40" aria-hidden />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-sb-ink/70">
                  By item
                </span>
              </div>
              <div
                className={
                  catalog.length <= 8
                    ? "grid grid-cols-3 sm:grid-cols-5 gap-3"
                    : "grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2"
                }
              >
                {catalog.map((item) => {
                  const m = masteryById.get(item.id);
                  return (
                    <ItemPill
                      key={item.id}
                      label={item.label}
                      description={item.description}
                      status={m?.status ?? "not_started"}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom strip — meta left, CTAs right. Secondary (if any)
              uses the quieter paper-bordered treatment so the primary
              ink-filled CTA owns visual weight. */}
          <div className="mt-14 sm:mt-16 flex items-center justify-between gap-4 border-t border-sb-ink/10 pt-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted">
              {metaLabel}
            </span>
            <div className="flex items-center gap-3">
              {secondaryCta && (
                <button
                  type="button"
                  onClick={secondaryCta.onClick}
                  className="px-6 py-4 rounded-2xl bg-transparent text-sb-ink border-2 border-sb-ink/30 hover:border-sb-ink hover:bg-sb-paper/50 font-mono font-bold text-[12px] sm:text-[13px] uppercase tracking-[0.18em] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface inline-flex items-center gap-3"
                >
                  {secondaryCta.label}
                  <span aria-hidden>→</span>
                </button>
              )}
              <button
                type="button"
                onClick={primaryCta.onClick}
                className="px-7 py-4 rounded-2xl bg-sb-ink text-white border-2 border-sb-ink shadow-xl shadow-sb-accent-deep/25 font-mono font-bold text-[13px] sm:text-[14px] uppercase tracking-[0.18em] hover:bg-sb-ink/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface inline-flex items-center gap-3"
              >
                {primaryCta.label}
                <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MetricTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-sb-ink/10 bg-sb-card/40 backdrop-blur-sm px-4 py-4 sm:py-5">
      <p className="font-mono font-bold text-sb-ink text-[20px] sm:text-[24px] md:text-[28px] leading-none">
        {value}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-sb-muted">
        {label}
      </p>
    </div>
  );
}

function ItemPill({
  label,
  description,
  status,
}: {
  label: string;
  description?: string;
  status: MasteryEntry["status"];
}) {
  const styles: Record<MasteryEntry["status"], string> = {
    mastered: "bg-sb-ink text-white border-sb-ink",
    practicing: "bg-sb-paper text-sb-ink border-sb-ink/30",
    needs_practice: "bg-sb-paper-soft text-sb-muted border-sb-ink/20",
    not_started: "bg-transparent text-sb-ink/40 border-sb-ink/10",
  };
  const statusLabel = status.replace("_", " ");
  return (
    <div
      className={`aspect-square rounded-xl border flex items-center justify-center font-mono font-bold text-[14px] sm:text-[15px] ${styles[status]}`}
      title={description ? `${description} — ${statusLabel}` : `${label} — ${statusLabel}`}
    >
      {label}
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close details"
      className="w-9 h-9 rounded-full border border-sb-ink/20 bg-sb-card/60 backdrop-blur-sm flex items-center justify-center text-sb-ink hover:bg-sb-card transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </button>
  );
}

function formatLastPracticed(iso: string | undefined): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
