import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { useCallback, useEffect, useState } from "react";
import { FreddyPosterCard } from "./FreddyPosterCard";
import {
  ComingSoonPosterCard,
  LaurelGlyph,
  SignHandGlyph,
  acutisTheme,
  aslTheme,
} from "./ComingSoonPosterCard";
import type { LessonModule } from "@/platform/lesson-sdk";

/**
 * LessonCarousel — Embla-based horizontal lesson carousel.
 *
 * Embla handles drag, mouse-wheel, touch swipe, click-vs-drag
 * discrimination, snap physics, and trackpad inertia detection (via
 * the official WheelGestures plugin). We avoid hand-rolling any of
 * these — they're well-known footguns and Embla is the de-facto React
 * standard for this kind of carousel.
 *
 * The viewport is intentionally full screen width: cards slide in
 * from the actual edge of the screen, not from the page's inner
 * content padding. Each slide is `flex: 0 0 100%`, so one card fills
 * the viewport; the card content inside the slide is centered with
 * the same `max-w` + horizontal padding as the banner above, keeping
 * the active card visually aligned with the SuperTutors banner.
 */

type CarouselLesson = {
  module: LessonModule;
  render: (onActivate: () => void) => React.ReactNode;
};

export function LessonCarousel({
  lessons,
  onActivate,
}: {
  lessons: LessonModule[];
  onActivate: (slug: string) => void;
}) {
  const items = buildCarouselItems(lessons);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "center", loop: false, containScroll: "trimSnaps" },
    [WheelGesturesPlugin()],
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi],
  );

  return (
    <div
      className="flex flex-col gap-3 sm:gap-4 flex-1 min-h-0"
      role="region"
      aria-roledescription="carousel"
      aria-label="SuperTutors lessons"
    >
      <div ref={emblaRef} className="overflow-hidden flex-1 min-h-0">
        <div className="flex h-full touch-pan-y">
          {items.map((item, i) => (
            <div
              key={item.module.slug}
              className="
                flex-[0_0_100%] min-w-0 h-full
                px-4 sm:px-6 md:px-8
              "
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${items.length}: ${item.module.meta.title}`}
              aria-hidden={i !== selectedIndex}
            >
              <div className="mx-auto h-full max-w-[1280px]">
                {item.render(() => onActivate(item.module.slug))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 shrink-0">
        {items.map((item, i) => (
          <button
            key={item.module.slug}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Go to lesson ${i + 1}: ${item.module.meta.title}`}
            aria-current={i === selectedIndex}
            data-cursor-pointing
            className={`
              h-2 rounded-full transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-surface
              ${
                i === selectedIndex
                  ? "w-8 bg-sb-ink"
                  : "w-2 bg-sb-ink/30 hover:bg-sb-ink/50 cursor-pointer"
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}

function buildCarouselItems(lessons: LessonModule[]): CarouselLesson[] {
  const bySlug = new Map(lessons.map((l) => [l.slug, l]));
  const items: CarouselLesson[] = [];

  const acutis = bySlug.get("acutis");
  if (acutis) {
    items.push({
      module: acutis,
      render: (onActivate) => (
        <ComingSoonPosterCard
          onActivate={onActivate}
          ariaLabel={`Preview ${acutis.meta.title} — coming soon`}
          lessonNumber="Lesson 02"
          title="Learn the"
          titleOutlined="CLASSICS"
          tutorName={acutis.meta.tutorName}
          tutorTagline="Virtue, great books, and the classical tradition."
          metaStrip="Acutis · Carlo · Classics"
          glyph={<LaurelGlyph />}
          theme={acutisTheme}
        />
      ),
    });
  }

  const asl = bySlug.get("asl");
  if (asl) {
    items.push({
      module: asl,
      render: (onActivate) => (
        <ComingSoonPosterCard
          onActivate={onActivate}
          ariaLabel={`Preview ${asl.meta.title} — coming soon`}
          lessonNumber="Lesson 03"
          title="Learn"
          titleOutlined="ASL"
          tutorName={asl.meta.tutorName}
          tutorTagline="Real-time hand tracking. Sage sees your signs."
          metaStrip="Sage · Hands · Camera"
          glyph={<SignHandGlyph />}
          theme={aslTheme}
        />
      ),
    });
  }

  const freddy = bySlug.get("freddy-fractions");
  if (freddy) {
    items.push({
      module: freddy,
      render: (onActivate) => (
        <FreddyPosterCard
          onActivate={onActivate}
          ariaLabel={`Start the ${freddy.meta.subject.toLowerCase()} lesson with ${freddy.meta.tutorName}`}
        />
      ),
    });
  }

  return items;
}
