import type React from "react";
import type { ProgressHandle } from "./progress/types";

export interface AudioEngineHandle {
  play: (
    key: string,
    opts?: { name?: string; onSpeakingChange?: (speaking: boolean) => void },
  ) => Promise<void>;
  preload: (key: string) => void;
  stop: () => void;
}

export interface CvCameraHandle {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export interface LessonMountProps {
  name: string;
  onComplete: (r: { outcome: "win" | "exit"; durationMs: number; itemId?: string }) => void;
  platform: {
    audio: AudioEngineHandle;
    cv?: CvCameraHandle;
    progress?: ProgressHandle;
    muted: boolean;
    setMuted: (m: boolean) => void;
  };
}

/** One item in the details-view by-item grid. Pure data — no React. */
export interface LessonCatalogItem {
  /** Stable item ID matching the `items` table, e.g. "asl:A". */
  id: string;
  /** Display glyph or short label rendered inside the pill. */
  label: string;
  /** Optional long-form description — surfaces as the pill tooltip. */
  description?: string;
}

/**
 * Copy + data the LessonDetailsView needs, owned by each lesson module
 * so the landing page never re-states it. Optional because placeholder
 * lessons (e.g. Acutis BrainLift) don't surface a details modal.
 */
export interface LessonDetailsCopy {
  /** Sequential lesson number — drives the "Lesson NN" eyebrow. */
  eyebrowNumber: number;
  /** Hero title pre-split by the lesson into stacked lines. */
  titleLines: { text: string; outline?: boolean }[];
  /** Subtitle broken into prefix + emphasized phrase + trailing copy so
   *  the view stays in control of rendering (no JSX in data). */
  subtitle: { prefix?: string; emphasis: string; trail: string };
  /** Bottom-strip meta label, e.g. "Pizza · Slicer · Glove". */
  metaLabel: string;
  /** Catalog driving the by-item grid + denominator. */
  catalog: LessonCatalogItem[];
  /** Primary CTA pill. `lessonMode` becomes `?lesson=` on navigation. */
  primaryCta: { label: string; lessonMode?: string };
  /** Optional secondary CTA, rendered quieter to the left of primary. */
  secondaryCta?: { label: string; lessonMode?: string };
}

export interface LessonModule {
  slug: string;
  meta: {
    title: string;
    tutorName: string;
    subject: string;
    audience: string;
    estimatedMinutes: number;
    /** Details-view copy + catalog. Omit for placeholder lessons. */
    details?: LessonDetailsCopy;
  };
  load: () => Promise<{
    Mount: React.ComponentType<LessonMountProps>;
    audio?: {
      basePath: string;
      lineLookup: (key: string) => string | undefined;
      voiceId?: string;
    };
    requires?: { camera?: boolean; microphone?: boolean };
  }>;
}
