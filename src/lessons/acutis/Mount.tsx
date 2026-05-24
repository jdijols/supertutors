import { ComingSoonMount } from "@/platform/ui/ComingSoonMount";
import type { LessonMountProps } from "@/platform/lesson-sdk";

export function AcutisMount(props: LessonMountProps) {
  return (
    <ComingSoonMount
      {...props}
      tutorName="Carlo"
      subject="Classical Studies"
      tagline="Virtue, great books, and the classical tradition — guided by your AI tutor Carlo."
    />
  );
}
