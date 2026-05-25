import { FreddyPosterCard } from "./FreddyPosterCard";
import {
  ComingSoonPosterCard,
  acutisTheme,
  aslTheme,
  LaurelGlyph,
  SignHandGlyph,
} from "./ComingSoonPosterCard";
import type { MasteryEntry } from "@/platform/progress/types";

interface LessonGridProps {
  onActivate: (slug: string) => void;
  mastery?: MasteryEntry[];
}

/**
 * LessonGrid — 3-card grid replacing the Embla carousel.
 *
 * Renders the three lesson poster cards in a responsive grid.
 * When mastery data is available (signed-in), overlays a progress
 * strip on each card.
 */
export function LessonGrid({ onActivate, mastery }: LessonGridProps) {
  const aslMastery = mastery?.filter((m) => m.itemId.startsWith("asl:")) ?? [];
  const freddyMastery =
    mastery?.filter((m) => m.itemId.startsWith("freddy:")) ?? [];

  const aslMastered = aslMastery.filter((m) => m.status === "mastered").length;
  const aslTotal = aslMastery.length;
  const freddyMastered = freddyMastery.filter(
    (m) => m.status === "mastered"
  ).length;
  const freddyTotal = freddyMastery.length;

  return (
    <section aria-label="Lessons" className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Freddy Fractions — always first */}
        <div className="relative">
          <FreddyPosterCard
            onActivate={() => onActivate("freddy-fractions")}
          />
          {freddyTotal > 0 && (
            <ProgressStrip mastered={freddyMastered} total={freddyTotal} />
          )}
        </div>

        {/* ASL with Sage */}
        <div className="relative">
          <ComingSoonPosterCard
            lessonNumber="Lesson 02"
            title="Learn"
            titleOutlined="ASL"
            tutorName="Sage"
            tutorTagline="Your camera sees what you sign."
            metaStrip="Hands · Camera · Signs"
            glyph={<SignHandGlyph />}
            theme={aslTheme}
            ariaLabel="Start the ASL lesson with Sage"
            onActivate={() => onActivate("asl")}
          />
          {aslTotal > 0 && (
            <ProgressStrip mastered={aslMastered} total={aslTotal} />
          )}
        </div>

        {/* Acutis Institute */}
        <div className="relative">
          <ComingSoonPosterCard
            lessonNumber="Lesson 03"
            title="Learn"
            titleOutlined="THEOLOGY"
            tutorName="Carlo"
            tutorTagline="Patron saint of the internet."
            metaStrip="Saints · Stories · Faith"
            glyph={<LaurelGlyph />}
            theme={acutisTheme}
            ariaLabel="Preview the theology lesson with Carlo"
            onActivate={() => onActivate("acutis")}
          />
        </div>
      </div>
    </section>
  );
}

function ProgressStrip({
  mastered,
  total,
}: {
  mastered: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 px-7 sm:px-10 md:px-8 pb-[52px] sm:pb-[56px] md:pb-[60px] pointer-events-none z-10">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-sb-ink/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-sb-accent-deep transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-sb-muted whitespace-nowrap">
          {mastered}/{total}
        </span>
      </div>
    </div>
  );
}
