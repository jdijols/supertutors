import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AboutCard } from "./AboutCard";
import { BrainliftCard } from "./BrainliftCard";
import { FreddyPosterCard } from "./FreddyPosterCard";
import { LessonDetailsView } from "./LessonDetailsView";
import { SuperTutorsLockup } from "./SuperTutorsLockup";
import { ASLPosterCard } from "@/lessons/asl/ASLPosterCard";
import { SignInButton } from "@/platform/auth/SignInButton";
import { SignInDialog } from "@/platform/auth/SignInDialog";
import { useAuth } from "@/platform/auth/useAuth";
import { getLessonBySlug } from "@/platform/registry";
import { useProgress } from "@/platform/progress/useProgress";
import { MuteToggle } from "@/platform/ui/MuteToggle";
import { UserMenu } from "@/platform/ui/UserMenu";
import type { LessonDetailsCopy } from "@/platform/lesson-sdk";
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

type LessonSlug = "asl" | "freddy-fractions";

/** Render the subtitle from its data parts. The emphasis span gets the
 *  ink-toned weight, matching the original inline JSX. */
function renderSubtitle(s: LessonDetailsCopy["subtitle"]) {
  return (
    <>
      {s.prefix ? `${s.prefix} ` : null}
      <span className="text-sb-ink font-medium">{s.emphasis}</span>{" "}
      {s.trail}
    </>
  );
}

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

  // Pull the lesson module so the details view can read all its display
  // copy from one place instead of LandingPage hardcoding it.
  const expandedLesson = useMemo(
    () => (expandedSlug ? getLessonBySlug(expandedSlug) : undefined),
    [expandedSlug],
  );

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
            shared layoutId. All copy + catalog comes from the lesson
            module's `meta.details`; LandingPage just wires events. */}
        <AnimatePresence>
          {expandedSlug && expandedLesson?.meta.details && (
            <motion.div
              layoutId={`lesson-card-${expandedSlug}`}
              className="absolute inset-0 z-50"
            >
              <LessonDetailsView
                slug={expandedSlug}
                eyebrow={`Lesson ${String(
                  expandedLesson.meta.details.eyebrowNumber,
                ).padStart(2, "0")}`}
                durationLabel={`~${expandedLesson.meta.estimatedMinutes} min`}
                titleLines={expandedLesson.meta.details.titleLines}
                subtitle={renderSubtitle(expandedLesson.meta.details.subtitle)}
                mastery={masteryForExpanded}
                catalog={expandedLesson.meta.details.catalog}
                metaLabel={expandedLesson.meta.details.metaLabel}
                onClose={() => setExpandedSlug(null)}
                primaryCta={{
                  label: expandedLesson.meta.details.primaryCta.label,
                  onClick: () =>
                    startLesson(
                      expandedSlug,
                      expandedLesson.meta.details!.primaryCta.lessonMode as
                        | "v3"
                        | "scripted"
                        | undefined,
                    ),
                }}
                secondaryCta={
                  expandedLesson.meta.details.secondaryCta
                    ? {
                        label:
                          expandedLesson.meta.details.secondaryCta.label,
                        onClick: () =>
                          startLesson(
                            expandedSlug,
                            expandedLesson.meta.details!.secondaryCta!
                              .lessonMode as
                              | "v3"
                              | "scripted"
                              | undefined,
                          ),
                      }
                    : undefined
                }
                onItemSelect={
                  // Only ASL supports per-item deep-link today; its
                  // practice loop is grid-driven so a focused item maps
                  // 1:1 onto a screen. Freddy's V3 is sequential so
                  // jumping to a single beat isn't meaningful.
                  expandedSlug === "asl"
                    ? (itemId) => {
                        setExpandedSlug(null);
                        navigate(
                          `/lessons/asl?focus=${encodeURIComponent(itemId)}`,
                        );
                      }
                    : undefined
                }
              />
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
