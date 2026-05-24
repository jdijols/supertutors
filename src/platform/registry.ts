import type { LessonModule } from "./lesson-sdk";
import { freddyFractionsLesson } from "@/lessons/freddy-fractions/index";
import { acutisLesson } from "@/lessons/acutis/index";
import { aslLesson } from "@/lessons/asl/index";

export const lessons: LessonModule[] = [freddyFractionsLesson, acutisLesson, aslLesson];

export function getLessonBySlug(slug: string): LessonModule | undefined {
  return lessons.find((l) => l.slug === slug);
}
