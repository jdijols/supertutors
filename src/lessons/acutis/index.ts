import type { LessonModule } from "@/platform/lesson-sdk";

export const acutisLesson: LessonModule = {
  slug: "acutis",
  meta: {
    title: "Carlo's Classical Studies",
    tutorName: "Carlo",
    subject: "Classical Studies",
    audience: "All ages",
    estimatedMinutes: 30,
  },
  load: async () => {
    const { AcutisMount } = await import("./Mount");
    return { Mount: AcutisMount };
  },
};
