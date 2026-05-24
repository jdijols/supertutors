import type { LessonModule } from "./lesson-sdk";
import { freddyFractionsLesson } from "@/lessons/freddy-fractions/index";

export const lessons: LessonModule[] = [freddyFractionsLesson];

export function getLessonBySlug(slug: string): LessonModule | undefined {
  return lessons.find((l) => l.slug === slug);
}
