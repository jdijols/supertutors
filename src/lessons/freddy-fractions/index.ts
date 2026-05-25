import type { LessonModule } from "@/platform/lesson-sdk";

export const freddyFractionsLesson: LessonModule = {
  slug: "freddy-fractions",
  meta: {
    title: "Freddy's Fractions",
    tutorName: "Freddy",
    subject: "Fractions",
    audience: "Grade 3",
    estimatedMinutes: 6,
  },
  load: async () => {
    const { FreddyMount } = await import("./Mount");
    const { freddyLineLookup } = await import("./audio-lines");
    return {
      Mount: FreddyMount,
      audio: {
        basePath: "/lessons/freddy-fractions/audio",
        lineLookup: freddyLineLookup,
        voiceId: "EXAVITQu4vr4xnSDxMaL",
      },
      requires: { camera: true },
    };
  },
};
