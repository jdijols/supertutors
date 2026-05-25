import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AboutCard } from "./AboutCard";
import { BrainliftCard } from "./BrainliftCard";
import { FreddyPosterCard } from "./FreddyPosterCard";
import { SuperTutorsLockup } from "./SuperTutorsLockup";
import { ASLPosterCard } from "@/lessons/asl/ASLPosterCard";
import { SignInDialog } from "@/platform/auth/SignInDialog";
import { useAuth } from "@/platform/auth/useAuth";
import { useProgress } from "@/platform/progress/useProgress";
import { MuteToggle } from "@/platform/ui/MuteToggle";
import { UserMenu } from "@/platform/ui/UserMenu";
import type { MasteryEntry } from "@/platform/progress/types";

export function LandingPage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const progress = useProgress();

  const [signInOpen, setSignInOpen] = useState(false);
  const [mastery, setMastery] = useState<MasteryEntry[]>([]);

  useEffect(() => {
    if (status !== "signed-in" || !progress) return;
    Promise.all([progress.getMastery("asl"), progress.getMastery("freddy-fractions")])
      .then(([asl, freddy]) => setMastery([...asl, ...freddy]))
      .catch(() => setMastery([]));
  }, [status, progress]);

  const freddyMastery = mastery.length > 0
    ? { mastered: mastery.filter((m) => m.status === "mastered").length, total: mastery.length }
    : undefined;

  const handleActivate = useCallback(
    (slug: string) => {
      if (status === "signed-out") {
        setSignInOpen(true);
        return;
      }
      navigate(`/lessons/${slug}`);
    },
    [status, navigate],
  );

  return (
    <main
      className="h-[100dvh] w-full bg-sb-ink text-sb-paper-soft antialiased flex flex-col px-6 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-5 md:py-6 gap-4 sm:gap-5 md:gap-6 ring-offset-sb-ink"
    >
      {/* Header row — lockup left, chrome right. Both are inline in the
          flow so they share the same baseline. App.tsx skips rendering
          its fixed-positioned chrome on this route. */}
      <header className="flex items-center justify-between gap-4 shrink-0 h-14 sm:h-16">
        <SuperTutorsLockup variant="onDark" size="inline" />
        <div className="flex items-center gap-3 sm:gap-4">
          <UserMenu inline />
          <MuteToggle inline surface="dark" />
        </div>
      </header>

      {/* Bento grid — fills remaining viewport */}
      <div className="grid grid-cols-1 md:grid-cols-5 grid-rows-4 md:grid-rows-2 gap-4 sm:gap-5 md:gap-6 flex-1 min-h-0">
        {/* Row 1: BrainLift (2/5) | ASL (3/5) */}
        <BrainliftCard
          className="md:col-span-2 md:row-span-1"
          onActivate={() => handleActivate("acutis")}
        />
        <ASLPosterCard
          className="md:col-span-3 md:row-span-1"
          onActivate={() => handleActivate("asl")}
        />

        {/* Row 2: Freddy (3/5) | About (2/5) */}
        <FreddyPosterCard
          className="md:col-span-3 md:row-span-1"
          onActivate={() => handleActivate("freddy-fractions")}
          progress={status === "signed-in" ? freddyMastery : undefined}
        />
        <AboutCard className="md:col-span-2 md:row-span-1" />
      </div>

      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
      />
    </main>
  );
}
