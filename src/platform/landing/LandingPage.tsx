import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
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

// Entrance animation tokens — header rises as one unit, cards cascade
// in reading order. ease curve is a smooth ease-out-quart for a quiet,
// confident reveal that doesn't draw attention to itself.
const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

const cardContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.6,
      staggerChildren: 0.36,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.65, ease: ENTRANCE_EASE },
  },
};

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
      {/* Header row — lockup left, chrome right. Both fade up together
          as a single unit. App.tsx skips its fixed-positioned chrome
          on this route. */}
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.65, ease: ENTRANCE_EASE, delay: 0.15 }}
        className="flex items-center justify-between gap-4 shrink-0 h-14 sm:h-16"
      >
        <SuperTutorsLockup variant="onDark" size="inline" />
        <div className="flex items-center gap-3 sm:gap-4">
          <UserMenu inline />
          <MuteToggle inline surface="dark" />
        </div>
      </motion.header>

      {/* Bento grid — fills remaining viewport. Cards cascade in via
          parent variants (staggerChildren). BrainLift + About are
          public surfaces (no auth gate); lessons (ASL + Freddy)
          trigger the sign-in dialog when signed out. */}
      <motion.div
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-5 grid-rows-4 md:grid-rows-2 gap-4 sm:gap-5 md:gap-6 flex-1 min-h-0"
      >
        {/* Row 1: BrainLift (2/5) | ASL (3/5) */}
        <motion.div variants={cardItemVariants} className="md:col-span-2 md:row-span-1">
          <BrainliftCard onActivate={() => navigate("/lessons/acutis")} />
        </motion.div>
        <motion.div variants={cardItemVariants} className="md:col-span-3 md:row-span-1">
          <ASLPosterCard onActivate={() => handleActivate("asl")} />
        </motion.div>

        {/* Row 2: Freddy (3/5) | About (2/5) */}
        <motion.div variants={cardItemVariants} className="md:col-span-3 md:row-span-1">
          <FreddyPosterCard
            onActivate={() => handleActivate("freddy-fractions")}
            progress={status === "signed-in" ? freddyMastery : undefined}
          />
        </motion.div>
        <motion.div variants={cardItemVariants} className="md:col-span-2 md:row-span-1">
          <AboutCard onActivate={() => navigate("/workflow")} />
        </motion.div>
      </motion.div>

      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
      />
    </main>
  );
}
