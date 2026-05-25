import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { LaurelMark } from "@/platform/landing/LaurelMark";

interface BrainliftViewerProps {
  markdown: string;
  title: string;
}

/**
 * Brief "success" pulse for fire-and-forget actions like Copy and Download.
 * Returns [active, trigger]. Active stays true for `duration` ms after
 * trigger is called, then auto-resets. Cleans up on unmount.
 */
function useTransientPulse(duration = 2000): [boolean, () => void] {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(t);
  }, [active, duration]);
  return [active, () => setActive(true)];
}

export function BrainliftViewer({ markdown, title }: BrainliftViewerProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"rendered" | "raw">("rendered");
  const [copied, flashCopied] = useTransientPulse();
  const [downloaded, flashDownloaded] = useTransientPulse();

  // Bulk toggle state for Expand all / Collapse all. Tracks the most
  // recent bulk action, not live DOM state — that keeps the button
  // predictable even when the user clicks individual sections between
  // bulk actions.
  const articleRef = useRef<HTMLElement>(null);
  const [lastBulk, setLastBulk] = useState<"collapsed" | "expanded">("collapsed");

  function toggleAll() {
    const next = lastBulk === "expanded" ? "collapsed" : "expanded";
    setLastBulk(next);
    articleRef.current
      ?.querySelectorAll("details")
      .forEach((d) => {
        d.open = next === "expanded";
      });
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(markdown)
      .then(() => flashCopied())
      .catch(() => {});
  }

  function handleDownload() {
    const url = URL.createObjectURL(
      new Blob([markdown], { type: "text/markdown" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "acutis-institute-brainlift.md";
    a.click();
    URL.revokeObjectURL(url);
    flashDownloaded();
  }

  // Shared idle styling — used by Back at all times, and Copy/Download
  // when not in success state. 44×44 honors iOS HIG tap target minimum
  // without imposing lesson chrome's brutalist border/shadow weight.
  const iconButtonIdle = [
    "border border-white/15 bg-white/5",
    "text-sb-paper/70 hover:text-sb-paper hover:bg-white/[0.08]",
  ].join(" ");

  // Shared success styling — inverts to paper-on-ink, matching the
  // system-wide "active state on dark surface = bg-sb-paper text-sb-ink"
  // rule from DESIGN.md. Visible from across the room.
  const iconButtonSuccess = "border border-sb-paper bg-sb-paper text-sb-ink";

  const iconButtonBase = [
    "w-11 h-11 rounded-xl",
    "flex items-center justify-center",
    "transition-colors duration-200",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink",
  ].join(" ");

  return (
    <div className="flex flex-col h-[100dvh] bg-sb-ink text-sb-paper-soft">
      {/* Top bar — brand mark + back nav left, viewer controls right.
          App.tsx skips its global fixed chrome on /lessons/acutis.
          No Mute (no audio on this surface) and no Exit pill (back
          arrow is the iPad-conventional navigation affordance here). */}
      <header className="flex items-center justify-between gap-4 px-6 sm:px-8 py-3 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <LaurelMark className="w-11 h-11 shrink-0" variant="onDark" title="SuperTutors" />
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Back to SuperTutors home"
            data-cursor-pointing
            className={`${iconButtonBase} ${iconButtonIdle}`}
          >
            <BackArrowIcon />
          </button>
          {/* Filename label — literal mixed-case mono so users know
              exactly which file they're copying or downloading. No
              uppercase / tracking treatment here; that's reserved for
              editorial eyebrows. This is identification, not chrome. */}
          <span className="font-mono text-[14px] sm:text-[15px] text-sb-paper/80 truncate">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Expand all / Collapse all — only meaningful in Rendered mode
              since Raw shows the literal markdown source. */}
          {mode === "rendered" && (
            <button
              type="button"
              onClick={toggleAll}
              aria-label={lastBulk === "expanded" ? "Collapse all sections" : "Expand all sections"}
              data-cursor-pointing
              className="h-11 px-4 rounded-xl border border-white/15 bg-white/5 font-mono text-xs uppercase tracking-[0.16em] text-sb-paper/70 hover:text-sb-paper hover:bg-white/[0.08] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink"
            >
              {lastBulk === "expanded" ? "Collapse all" : "Expand all"}
            </button>
          )}

          {/* Rendered / Raw toggle */}
          <div
            role="group"
            aria-label="View mode"
            className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1"
          >
            <button
              onClick={() => setMode("rendered")}
              aria-pressed={mode === "rendered"}
              className={[
                "px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink",
                mode === "rendered"
                  ? "bg-sb-paper text-sb-ink"
                  : "text-sb-paper/60 hover:text-sb-paper",
              ].join(" ")}
            >
              Rendered
            </button>
            <button
              onClick={() => setMode("raw")}
              aria-pressed={mode === "raw"}
              className={[
                "px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink",
                mode === "raw"
                  ? "bg-sb-paper text-sb-ink"
                  : "text-sb-paper/60 hover:text-sb-paper",
              ].join(" ")}
            >
              Raw
            </button>
          </div>

          <button
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy markdown to clipboard"}
            data-cursor-pointing
            data-state={copied ? "success" : "idle"}
            className={`${iconButtonBase} ${copied ? iconButtonSuccess : iconButtonIdle}`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>

          <button
            onClick={handleDownload}
            aria-label={downloaded ? "Downloaded markdown file" : "Download markdown file"}
            data-cursor-pointing
            data-state={downloaded ? "success" : "idle"}
            className={`${iconButtonBase} ${downloaded ? iconButtonSuccess : iconButtonIdle}`}
          >
            {downloaded ? <CheckIcon /> : <DownloadIcon />}
          </button>
        </div>
      </header>

      {/* Visually hidden live region — screen readers announce action
          completion without disrupting sighted users. */}
      <div role="status" aria-live="polite" className="sr-only">
        {copied && "Markdown copied to clipboard."}
        {downloaded && "Markdown file downloaded."}
      </div>

      {/* Body */}
      <main className="flex-1 overflow-y-auto py-12 px-6 sm:px-8">
        <div className="max-w-prose mx-auto">
          {mode === "rendered" ? (
            <article ref={articleRef} className="prose prose-invert prose-sb max-w-none">
              {/*
                rehype-raw enables the <details>/<summary> HTML tags
                authored in the brainlift markdown source. Safe here
                because the markdown is bundled at build time via
                Vite's ?raw import — not user input.
              */}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {markdown}
              </ReactMarkdown>
            </article>
          ) : (
            <pre className="font-mono text-sm text-sb-paper-soft whitespace-pre-wrap">
              {markdown}
            </pre>
          )}
        </div>
      </main>
    </div>
  );
}

/* --- Icons (Lucide-style, inline SVG so no extra dependency) --- */

function BackArrowIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CheckIcon() {
  // Slightly heavier stroke on the success state — reads as "done" from
  // across the room and reinforces the inverted bg's confidence signal.
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
