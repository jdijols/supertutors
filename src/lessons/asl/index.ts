import type { LessonModule } from "@/platform/lesson-sdk";
import { TRAINED_SIGNS } from "./vocab";

export const aslLesson: LessonModule = {
  slug: "asl",
  meta: {
    title: "Sign Language with Sage",
    tutorName: "Sage",
    subject: "Sign Language",
    audience: "Grade 2+",
    estimatedMinutes: 15,
    details: {
      eyebrowNumber: 2,
      titleLines: [
        { text: "Learn" },
        { text: "AMERICAN", outline: true },
        { text: "SIGN LANGUAGE", outline: true },
      ],
      subtitle: {
        prefix: "with",
        emphasis: "Sage",
        trail: "and your camera right at home.",
      },
      metaLabel: "Camera · Hand · Sign",
      catalog: TRAINED_SIGNS.map((s) => ({ id: s.id, label: s.glyph })),
      primaryCta: { label: "Continue lesson" },
    },
  },
  load: async () => {
    const { AslMount } = await import("./Mount");
    return { Mount: AslMount, requires: { camera: true } };
  },
};
