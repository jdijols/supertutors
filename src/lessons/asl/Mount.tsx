import { ComingSoonMount } from "@/platform/ui/ComingSoonMount";
import type { LessonMountProps } from "@/platform/lesson-sdk";

export function AslMount(props: LessonMountProps) {
  return (
    <ComingSoonMount
      {...props}
      tutorName="Sage"
      subject="Sign Language"
      tagline="Learn ASL with real-time hand tracking — Sage sees your signs and guides you through."
    />
  );
}
