import type React from "react";

export interface AudioEngineHandle {
  play: (key: string) => Promise<void>;
  preload: (key: string) => void;
  stop: () => void;
}

export interface CvCameraHandle {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export interface LessonMountProps {
  name: string;
  onComplete: (r: { outcome: "win" | "exit"; durationMs: number }) => void;
  platform: {
    audio: AudioEngineHandle;
    cv?: CvCameraHandle;
    muted: boolean;
    setMuted: (m: boolean) => void;
  };
}

export interface LessonModule {
  slug: string;
  meta: {
    title: string;
    tutorName: string;
    subject: string;
    audience: string;
    estimatedMinutes: number;
    cover: string;
    accent: string;
  };
  load: () => Promise<{
    Mount: React.ComponentType<LessonMountProps>;
    audio?: {
      basePath: string;
      lineLookup: (key: string) => string | undefined;
      voiceId?: string;
    };
    requires?: { camera?: boolean; microphone?: boolean };
  }>;
}
