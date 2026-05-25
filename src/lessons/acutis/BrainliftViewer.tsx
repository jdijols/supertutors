import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LaurelMark } from "@/platform/landing/LaurelMark";

interface BrainliftViewerProps {
  markdown: string;
  title: string;
}

export function BrainliftViewer({ markdown, title }: BrainliftViewerProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"rendered" | "raw">("rendered");

  function handleCopy() {
    navigator.clipboard.writeText(markdown).catch(() => {});
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
  }

  // Shared button class — used by Back, Copy, Download. 44×44 honors
  // iOS HIG tap target minimum without imposing the lesson chrome's
  // brutalist border/shadow weight on a document reader audience.
  const iconButtonClass = [
    "w-11 h-11 rounded-xl border border-white/15 bg-white/5",
    "flex items-center justify-center",
    "text-sb-paper/70 hover:text-sb-paper hover:bg-white/[0.08]",
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
            className={iconButtonClass}
          >
            <BackArrowIcon />
          </button>
          <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-sb-paper/60">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-3">
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
            aria-label="Copy markdown to clipboard"
            data-cursor-pointing
            className={iconButtonClass}
          >
            <CopyIcon />
          </button>

          <button
            onClick={handleDownload}
            aria-label="Download markdown file"
            data-cursor-pointing
            className={iconButtonClass}
          >
            <DownloadIcon />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto py-12 px-6 sm:px-8">
        <div className="max-w-prose mx-auto">
          {mode === "rendered" ? (
            <article className="prose prose-invert prose-sb max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
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
