import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AboutModal } from "./AboutModal";
import { LessonCarousel } from "./LessonCarousel";
import { SuperTutorsLockup } from "./SuperTutorsLockup";
import { lessons } from "@/platform/registry";
import { InfoToggle } from "@/platform/ui/InfoToggle";

export function LandingPage() {
  const navigate = useNavigate();
  const [aboutOpen, setAboutOpen] = useState(false);

  const comingSoon = lessons.filter((l) => l.slug !== "freddy-fractions");

  return (
    <main className="h-[100dvh] w-full bg-sb-surface font-sans text-sb-ink antialiased flex flex-col gap-4 sm:gap-5 md:gap-6 py-4 sm:py-6 md:py-8">
      {/* Banner — stays inside the centered max-w container with normal
          horizontal padding. */}
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 shrink-0">
        <section
          aria-label="SuperTutors banner"
          className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] bg-sb-ink text-white pl-5 pr-32 sm:pl-8 sm:pr-40 md:pl-12 md:pr-44 py-5 sm:py-7 md:py-9"
        >
          <SuperTutorsLockup variant="onDark" size="lg" />
        </section>
      </div>

      {/* Carousel — full viewport width so cards slide in from the actual
          screen edge. The carousel's internal slide layout re-applies
          the same max-w + px treatment so the active card visually
          aligns with the banner. */}
      <LessonCarousel
        lessons={lessons}
        onActivate={(slug) => navigate(`/lessons/${slug}`)}
      />

      <InfoToggle active={aboutOpen} onToggle={() => setAboutOpen((v) => !v)} />

      <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        comingSoon={comingSoon}
        onNavigate={(slug) => navigate(`/lessons/${slug}`)}
      />
    </main>
  );
}
