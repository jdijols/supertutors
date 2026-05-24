import type { LessonModule } from "./lesson-sdk";

export const lessons: LessonModule[] = [];

export function getLessonBySlug(slug: string): LessonModule | undefined {
  return lessons.find((l) => l.slug === slug);
}
