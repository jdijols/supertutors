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
 * Progress info is passed into each card and rendered as part of
 * the card's natural bottom layout (not a floating overlay).
 */
export function LessonGrid({ onActivate, mastery }: LessonGridProps) {
  const aslMastery = mastery?.filter((m) => m.itemId.startsWith("asl:")) ?? [];
  const freddyMastery =
    mastery?.filter((m) => m.itemId.startsWith("freddy:")) ?? [];

  const aslProgress =
    aslMastery.length > 0
      ? {
          mastered: aslMastery.filter((m) => m.status === "mastered").length,
          total: aslMastery.length,
        }
      : undefined;

  const freddyProgress =
    freddyMastery.length > 0
      ? {
          mastered: freddyMastery.filter((m) => m.status === "mastered").length,
          total: freddyMastery.length,
        }
      : undefined;

  return (
    <section aria-label="Lessons" className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Freddy Fractions */}
        <FreddyPosterCard
          onActivate={() => onActivate("freddy-fractions")}
          progress={freddyProgress}
        />

        {/* ASL with Sage — available, real lesson */}
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
          available
          progress={aslProgress}
        />

        {/* Acutis Institute — still coming-soon stub */}
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
    </section>
  );
}
