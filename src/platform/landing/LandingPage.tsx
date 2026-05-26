import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AboutCard } from "./AboutCard";
import { BrainliftCard } from "./BrainliftCard";
import { FreddyPosterCard } from "./FreddyPosterCard";
import { LessonDetailsView, type LessonCatalogItem } from "./LessonDetailsView";
import { SuperTutorsLockup } from "./SuperTutorsLockup";
import { ASLPosterCard } from "@/lessons/asl/ASLPosterCard";
import { TRAINED_SIGNS } from "@/lessons/asl/vocab";
import { FREDDY_CATALOG } from "@/lessons/freddy-fractions/catalog";
import { SignInButton } from "@/platform/auth/SignInButton";
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

// Lesson catalogs — drive denominators + by-item grids in the details
// view. ASL = 26 letters + 8 word signs (34 items). Freddy = 5 V3
// assessment beats (count halves / write ½ / name quarter / count
// quarters / write ¼).
const ASL_CATALOG: LessonCatalogItem[] = TRAINED_SIGNS.map((s) => ({
  id: s.id,
  label: s.glyph,
}));

const FREDDY_CATALOG_ITEMS: LessonCatalogItem[] = FREDDY_CATALOG.map((c) => ({
  id: c.id,
  label: c.label,
  description: c.description,
}));

type LessonSlug = "asl" | "freddy-fractions";

export function LandingPage() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const progress = useProgress();

  const [signInOpen, setSignInOpen] = useState(false);
  const [aslMastery, setAslMastery] = useState<MasteryEntry[]>([]);
  const [freddyMastery, setFreddyMastery] = useState<MasteryEntry[]>([]);
  const [expandedSlug, setExpandedSlug] = useState<LessonSlug | null>(null);

  useEffect(() => {
    if (status !== "signed-in" || !progress) {
      setAslMastery([]);
      setFreddyMastery([]);
      return;
    }
    Promise.all([
      progress.getMastery("asl"),
      progress.getMastery("freddy-fractions"),
    ])
      .then(([asl, freddy]) => {
        setAslMastery(asl);
        setFreddyMastery(freddy);
      })
      .catch(() => {
        setAslMastery([]);
        setFreddyMastery([]);
      });
  }, [status, progress]);

  // Lesson card click router: signed-out → sign-in modal; signed-in with
  // no prior attempts → straight to the lesson; signed-in with progress
  // → expand-in-place to the details view.
  const handleLessonClick = useCallback(
    (slug: LessonSlug, mastery: MasteryEntry[]) => {
      if (status === "signed-out") {
        setSignInOpen(true);
        return;
      }
      if (mastery.length === 0) {
        navigate(`/lessons/${slug}`);
        return;
      }
      setExpandedSlug(slug);
    },
    [status, navigate],
  );

  const startLesson = useCallback(
    (slug: LessonSlug, lessonMode?: "v3" | "scripted") => {
      setExpandedSlug(null);
      const suffix = lessonMode ? `?lesson=${lessonMode}` : "";
      navigate(`/lessons/${slug}${suffix}`);
    },
    [navigate],
  );

  const masteryForExpanded = useMemo(() => {
    if (expandedSlug === "asl") return aslMastery;
    if (expandedSlug === "freddy-fractions") return freddyMastery;
    return [];
  }, [expandedSlug, aslMastery, freddyMastery]);

  return (
    <main
      className="h-[100dvh] w-full bg-sb-ink text-sb-paper-soft antialiased flex flex-col px-6 sm:px-8 md:px-12 lg:px-16 py-4 sm:py-5 md:py-6 gap-4 sm:gap-5 md:gap-6 ring-offset-sb-ink"
    >
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.65, ease: ENTRANCE_EASE, delay: 0.15 }}
        className="flex items-center justify-between gap-4 shrink-0 h-14 sm:h-16"
      >
        <SuperTutorsLockup variant="onDark" size="inline" />
        <div className="flex items-center gap-3 sm:gap-4">
          <UserMenu inline />
          <SignInButton inline onClick={() => setSignInOpen(true)} />
          <MuteToggle inline surface="dark" />
        </div>
      </motion.header>

      <motion.div
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative grid grid-cols-1 md:grid-cols-5 grid-rows-4 md:grid-rows-2 gap-4 sm:gap-5 md:gap-6 flex-1 min-h-0"
      >
        {/* Row 1: BrainLift (2/5) | ASL (3/5) */}
        <motion.div
          variants={cardItemVariants}
          animate={{
            opacity: expandedSlug ? 0 : 1,
            transition: { duration: 0.3, ease: ENTRANCE_EASE },
          }}
          className="md:col-span-2 md:row-span-1"
        >
          <BrainliftCard onActivate={() => navigate("/lessons/acutis")} />
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          animate={{
            opacity: expandedSlug && expandedSlug !== "asl" ? 0 : 1,
            transition: { duration: 0.3, ease: ENTRANCE_EASE },
          }}
          className="md:col-span-3 md:row-span-1"
        >
          {expandedSlug !== "asl" && (
            <motion.div layoutId="lesson-card-asl" className="w-full h-full">
              <ASLPosterCard
                onActivate={() => handleLessonClick("asl", aslMastery)}
              />
            </motion.div>
          )}
        </motion.div>

        {/* Row 2: Freddy (3/5) | About (2/5) */}
        <motion.div
          variants={cardItemVariants}
          animate={{
            opacity:
              expandedSlug && expandedSlug !== "freddy-fractions" ? 0 : 1,
            transition: { duration: 0.3, ease: ENTRANCE_EASE },
          }}
          className="md:col-span-3 md:row-span-1"
        >
          {expandedSlug !== "freddy-fractions" && (
            <motion.div
              layoutId="lesson-card-freddy-fractions"
              className="w-full h-full"
            >
              <FreddyPosterCard
                onActivate={() =>
                  handleLessonClick("freddy-fractions", freddyMastery)
                }
              />
            </motion.div>
          )}
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          animate={{
            opacity: expandedSlug ? 0 : 1,
            transition: { duration: 0.3, ease: ENTRANCE_EASE },
          }}
          className="md:col-span-2 md:row-span-1"
        >
          <AboutCard onActivate={() => navigate("/workflow")} />
        </motion.div>

        {/* Expanded details — layered over the grid, animated via
            shared layoutId. */}
        <AnimatePresence>
          {expandedSlug && (
            <motion.div
              layoutId={`lesson-card-${expandedSlug}`}
              className="absolute inset-0 z-50"
            >
              {expandedSlug === "asl" ? (
                <LessonDetailsView
                  slug="asl"
                  eyebrow="Lesson 02"
                  durationLabel="~15 min"
                  titleLines={[
                    { text: "Learn" },
                    { text: "AMERICAN", outline: true },
                    { text: "SIGN LANGUAGE", outline: true },
                  ]}
                  subtitle={
                    <>
                      with <span className="text-sb-ink font-medium">Sage</span>
                      {" "}and your camera right at home.
                    </>
                  }
                  mastery={masteryForExpanded}
                  catalog={ASL_CATALOG}
                  metaLabel="Camera · Hand · Sign"
                  onClose={() => setExpandedSlug(null)}
                  primaryCta={{
                    label: "Continue lesson",
                    onClick: () => startLesson("asl"),
                  }}
                />
              ) : (
                // Freddy returning-user details view exposes both stages:
                // primary CTA jumps into the structured V3 curriculum;
                // secondary "Explore" reopens the V2 sandbox without
                // forcing auto-advance.
                <LessonDetailsView
                  slug="freddy-fractions"
                  eyebrow="Lesson 01"
                  durationLabel="~10 min"
                  titleLines={[
                    { text: "Learn" },
                    { text: "FRACTION", outline: true },
                    { text: "EQUIVALENCE", outline: true },
                  ]}
                  subtitle={
                    <>
                      with{" "}
                      <span className="text-sb-ink font-medium">
                        Freddy Fractions
                      </span>{" "}
                      at SuperSlice Pizza.
                    </>
                  }
                  mastery={masteryForExpanded}
                  catalog={FREDDY_CATALOG_ITEMS}
                  metaLabel="Pizza · Slicer · Glove"
                  onClose={() => setExpandedSlug(null)}
                  primaryCta={{
                    label: "Continue lesson",
                    onClick: () => startLesson("freddy-fractions", "v3"),
                  }}
                  secondaryCta={{
                    label: "Explore sandbox",
                    onClick: () => startLesson("freddy-fractions", "scripted"),
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <SignInDialog
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
      />
    </main>
  );
}
