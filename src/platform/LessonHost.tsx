import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AudioEngine } from "./audio/AudioEngine";
import { getNameAudioUrl } from "./audio/nameAudioCache";
import { getLessonBySlug } from "./registry";
import { usePlatformStore } from "./stores/platformStore";
import type { AudioEngineHandle, LessonMountProps } from "./lesson-sdk";
import type React from "react";

type LoadedModule = Awaited<ReturnType<NonNullable<ReturnType<typeof getLessonBySlug>>["load"]>>;

export function LessonHost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { name, muted, setMuted, setCurrentLessonSlug } = usePlatformStore();

  const lesson = slug ? getLessonBySlug(slug) : undefined;

  const [loaded, setLoaded] = useState<LoadedModule | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [cvEnabled, setCvEnabled] = useState(false);

  useEffect(() => {
    if (!lesson) {
      setLoadError(true);
      return;
    }
    setCurrentLessonSlug(lesson.slug);
    setLoaded(null);
    setLoadError(false);
    setCvEnabled(false);
    lesson
      .load()
      .then(setLoaded)
      .catch(() => setLoadError(true));
    return () => setCurrentLessonSlug(null);
  }, [lesson, setCurrentLessonSlug]);

  const audioHandle: AudioEngineHandle | null = useMemo(() => {
    if (!loaded?.audio) return null;
    const voiceId = loaded.audio.voiceId;
    const engine = new AudioEngine({
      audioBasePath: loaded.audio.basePath,
      lineLookup: loaded.audio.lineLookup,
      resolveNameUrl: voiceId
        ? (name) => getNameAudioUrl(name, { voiceId })
        : undefined,
    });
    return {
      play: (key, opts) =>
        new Promise<void>((resolve) => {
          engine.play({
            dialogueKey: key,
            name: opts?.name,
            onSpeakingChange: opts?.onSpeakingChange,
            onDone: resolve,
          });
        }),
      preload: (key) => engine.preloadDialogue(key),
      stop: () => engine.stop(),
    };
  }, [loaded]);

  if (!lesson || loadError) {
    return (
      <div className="flex items-center justify-center h-screen bg-sb-surface text-sb-ink font-mono">
        <div className="text-center p-8">
          <p className="text-2xl font-bold mb-2">Lesson not found</p>
          <p className="text-sm opacity-70 mb-4">No lesson registered for "{slug}"</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg border-2 border-sb-ink bg-sb-paper hover:bg-sb-paper-deep transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  if (!loaded || !audioHandle) {
    return (
      <div className="flex items-center justify-center h-screen bg-sb-surface text-sb-ink font-mono">
        <p className="text-xl animate-pulse">Loading {lesson.meta.title}…</p>
      </div>
    );
  }

  const Mount = loaded.Mount as React.ComponentType<LessonMountProps>;

  const requiresCamera = loaded?.requires?.camera ?? false;

  const platform: LessonMountProps["platform"] = {
    audio: audioHandle,
    muted,
    setMuted,
    ...(requiresCamera ? { cv: { enabled: cvEnabled, setEnabled: setCvEnabled } } : {}),
  };

  function handleComplete({ outcome }: { outcome: "win" | "exit"; durationMs: number }) {
    void outcome;
    navigate("/");
  }

  return (
    <Mount
      name={name ?? ""}
      onComplete={handleComplete}
      platform={platform}
    />
  );
}
