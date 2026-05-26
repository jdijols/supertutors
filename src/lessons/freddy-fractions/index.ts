import type { LessonModule } from "@/platform/lesson-sdk";
import { FREDDY_CATALOG } from "./catalog";

export const freddyFractionsLesson: LessonModule = {
  slug: "freddy-fractions",
  meta: {
    title: "Freddy's Fractions",
    tutorName: "Freddy",
    subject: "Fractions",
    audience: "Grade 3",
    estimatedMinutes: 10,
    details: {
      eyebrowNumber: 1,
      titleLines: [
        { text: "Learn" },
        { text: "FRACTION", outline: true },
        { text: "EQUIVALENCE", outline: true },
      ],
      subtitle: {
        prefix: "with",
        emphasis: "Freddy Fractions",
        trail: "at SuperSlice Pizza.",
      },
      metaLabel: "Pizza · Slicer · Glove",
      catalog: FREDDY_CATALOG.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
      })),
      primaryCta: { label: "Continue lesson", lessonMode: "v3" },
      secondaryCta: { label: "Explore sandbox", lessonMode: "scripted" },
    },
  },
  load: async () => {
    const { FreddyMount } = await import("./Mount");
    const { freddyLineLookup } = await import("./audio-lines");
    return {
      Mount: FreddyMount,
      audio: {
        basePath: "/lessons/freddy-fractions/audio",
        lineLookup: freddyLineLookup,
        // Freddy's voice — Italian-American chef ("Super Mario meets Jersey Shore").
        // Must match the voiceId in tutor/dialogue.json so the dynamic name
        // generation matches the pre-recorded MP3s. The wrong voiceId here
        // makes the kid's name sound like a different (generic) voice while
        // every other line is Freddy.
        voiceId: "QzTKubutNn9TjrB7Xb2Q",
      },
      requires: { camera: true },
    };
  },
};
