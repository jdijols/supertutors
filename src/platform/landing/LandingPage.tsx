import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AboutModal } from "./AboutModal";
import { ActivityFeed } from "./ActivityFeed";
import { Hero } from "./Hero";
import { LessonGrid } from "./LessonGrid";
import { SuperTutorsLockup } from "./SuperTutorsLockup";
import { SignInDialog } from "@/platform/auth/SignInDialog";
import { useAuth } from "@/platform/auth/useAuth";
import { useProgress } from "@/platform/progress/useProgress";
import { lessons } from "@/platform/registry";
import { InfoToggle } from "@/platform/ui/InfoToggle";
import type { MasteryEntry } from "@/platform/progress/types";

/**
 * LandingPage — the landing-as-dashboard surface.
 *
 * Same canvas for signed-in dashboard and signed-out marketing.
 * Branches on auth state to show personalized content or marketing.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const progress = useProgress();

  const [aboutOpen, setAboutOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [mastery, setMastery] = useState<MasteryEntry[]>([]);

  // Fetch mastery data when signed in
  useEffect(() => {
    if (status !== "signed-in" || !progress) return;
    // Load mastery for all lessons
    Promise.all([progress.getMastery("asl"), progress.getMastery("freddy-fractions")])
      .then(([asl, freddy]) => setMastery([...asl, ...freddy]))
      .catch(() => setMastery([]));
  }, [status, progress]);

  const comingSoon = lessons.filter((l) => l.slug !== "freddy-fractions");

  const displayName = formatDisplayName(
    user?.user_metadata?.display_name as string | undefined,
    user?.email,
  );

  // If signed-out user clicks a lesson card, prompt sign-in first
  const handleActivate = useCallback(
    (slug: string) => {
      if (status === "signed-out") {
        setSignInOpen(true);
        return;
      }
      navigate(`/lessons/${slug}`);
    },
    [status, navigate]
  );

  return (
    <main className="min-h-[100dvh] w-full bg-sb-surface font-sans text-sb-ink antialiased">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 flex flex-col gap-6 sm:gap-8">
        {/* Banner */}
        <section
          aria-label="SuperTutors banner"
          className="relative overflow-hidden rounded-[22px] sm:rounded-[26px] bg-sb-ink text-white pl-5 pr-32 sm:pl-8 sm:pr-40 md:pl-12 md:pr-44 py-5 sm:py-7 md:py-9 shrink-0"
        >
          <SuperTutorsLockup variant="onDark" size="lg" />
        </section>

        {/* Hero */}
        <Hero
          authStatus={status}
          displayName={displayName}
          onSignIn={() => setSignInOpen(true)}
          onContinue={
            status === "signed-in"
              ? () => navigate("/lessons/asl")
              : undefined
          }
        />

        {/* Lesson Grid */}
        <LessonGrid
          onActivate={handleActivate}
          mastery={status === "signed-in" ? mastery : undefined}
        />

        {/* Activity Feed — signed-in only */}
        {status === "signed-in" && progress && (
          <ActivityFeed progress={progress} />
        )}

        {/* Bottom padding */}
        <div className="h-4" />
      </div>

      {/* Chrome */}
      <InfoToggle
        active={aboutOpen}
        onToggle={() => setAboutOpen((v) => !v)}
      />

      <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        comingSoon={comingSoon}
        onNavigate={(slug) => navigate(`/lessons/${slug}`)}
      />

      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
      />
    </main>
  );
}

/**
 * Derive a friendly display name. If the user provided one explicitly
 * (auth user_metadata.display_name), use it verbatim. Otherwise derive
 * from the email prefix and capitalize the first letter — "demo" → "Demo".
 */
function formatDisplayName(
  metadataName: string | undefined,
  email: string | undefined,
): string {
  if (metadataName && metadataName.trim()) return metadataName;
  const prefix = email?.split("@")[0];
  if (!prefix) return "learner";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
