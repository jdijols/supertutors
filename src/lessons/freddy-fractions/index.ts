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
