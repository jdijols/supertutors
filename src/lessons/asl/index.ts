import type { LessonModule } from "@/platform/lesson-sdk";

export const aslLesson: LessonModule = {
  slug: "asl",
  meta: {
    title: "Sign Language with Sage",
    tutorName: "Sage",
    subject: "Sign Language",
    audience: "Grade 2+",
    estimatedMinutes: 15,
    cover: "/lessons/asl/cover.png",
    accent: "asl-teal",
  },
  load: async () => {
    const { AslMount } = await import("./Mount");
    return { Mount: AslMount, requires: { camera: true } };
  },
};
