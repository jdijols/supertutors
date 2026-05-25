import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AudioEngine } from "./audio/AudioEngine";
import { getNameAudioUrl } from "./audio/nameAudioCache";
import { getLessonBySlug } from "./registry";
import { useProgress } from "./progress/useProgress";
import { usePlatformStore } from "./stores/platformStore";
import type { AudioEngineHandle, CvCameraHandle, LessonMountProps } from "./lesson-sdk";
import type React from "react";

type LoadedModule = Awaited<ReturnType<NonNullable<ReturnType<typeof getLessonBySlug>>["load"]>>;

function readInitialCvEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("cv") === "true";
}

function syncCvUrlParam(enabled: boolean): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (enabled) url.searchParams.set("cv", "true");
  else url.searchParams.delete("cv");
  window.history.replaceState(null, "", url.toString());
}

export function LessonHost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { name, muted, setMuted, setCurrentLessonSlug } = usePlatformStore();

  const progress = useProgress();
  const lesson = slug ? getLessonBySlug(slug) : undefined;
  // Sync condition computed inline (no effect) so we don't trigger the
  // react-hooks/set-state-in-effect rule. The "lesson not found" view is
  // purely derived from the slug + registry lookup.
  const slugNotFound = slug !== undefined && lesson === undefined;

  const [loaded, setLoaded] = useState<LoadedModule | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [cvEnabled, setCvEnabledRaw] = useState<boolean>(readInitialCvEnabled);

  // Wrap setEnabled so URL stays in sync with state — keeps `?cv=true`
  // deep links and back-button navigation honest.
  const setCvEnabled = useCallback((enabled: boolean) => {
    setCvEnabledRaw(enabled);
    syncCvUrlParam(enabled);
  }, []);

  useEffect(() => {
    if (!lesson) return;
    setCurrentLessonSlug(lesson.slug);
    // Legitimate "reset state when input (lesson) changes" pattern.
    // React 19's stricter rule flags this; the alternative is keying
    // the whole subtree on lesson.slug, which is heavier. The intent
    // is unambiguous and the inputs are stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCvEnabledRaw(readInitialCvEnabled());
    lesson
      .load()
      .then(setLoaded)
      .catch(() => setLoadError(true));
    return () => setCurrentLessonSlug(null);
  }, [lesson, setCurrentLessonSlug]);

  const audioHandle: AudioEngineHandle = useMemo<AudioEngineHandle>(() => {
    // Lessons that don't declare audio get a no-op handle so the
    // contract stays non-optional and Mounts can always call
    // platform.audio.play() without null-checks.
    if (!loaded?.audio) {
      return {
        play: () => Promise.resolve(),
        preload: () => {},
        stop: () => {},
      };
    }
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

  if (slugNotFound || loadError) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-sb-surface text-sb-ink font-mono">
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

  if (!lesson) {
    return null;
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-sb-surface text-sb-ink font-mono">
        <p className="text-xl animate-pulse">Loading {lesson.meta.title}…</p>
      </div>
    );
  }

  const Mount = loaded.Mount as React.ComponentType<LessonMountProps>;

  const requiresCamera = loaded?.requires?.camera ?? false;
  const cvHandle: CvCameraHandle = { enabled: cvEnabled, setEnabled: setCvEnabled };

  const platform: LessonMountProps["platform"] = {
    audio: audioHandle,
    muted,
    setMuted,
    ...(requiresCamera ? { cv: cvHandle } : {}),
    ...(progress ? { progress } : {}),
  };

  function handleComplete({
    outcome,
    itemId,
  }: {
    outcome: "win" | "exit";
    durationMs: number;
    itemId?: string;
  }) {
    // If the lesson reports a win and provides an itemId, record a pass
    // attempt. The lesson is responsible for startSession/endSession.
    // Lessons that don't write progress (e.g. Freddy in its current form)
    // just navigate away — that's fine.
    void outcome;
    void itemId;
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
