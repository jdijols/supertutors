import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BrainliftViewerProps {
  markdown: string;
  title: string;
}

export function BrainliftViewer({ markdown, title }: BrainliftViewerProps) {
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

  return (
    <div className="flex flex-col h-[100dvh] bg-sb-ink text-sb-paper-soft">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 px-6 sm:px-8 h-16 shrink-0 border-b border-white/10">
        <span className="font-mono text-[13px] uppercase tracking-[0.18em] text-sb-paper/60">
          {title}
        </span>

        <div className="flex items-center gap-2">
          {/* Rendered / Raw toggle */}
          <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
            <button
              onClick={() => setMode("rendered")}
              className={[
                "px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-200",
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
              className={[
                "px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-[0.16em] transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink",
                mode === "raw"
                  ? "bg-sb-paper text-sb-ink"
                  : "text-sb-paper/60 hover:text-sb-paper",
              ].join(" ")}
            >
              Raw
            </button>
          </div>

          {/* Copy */}
          <button
            onClick={handleCopy}
            aria-label="Copy markdown to clipboard"
            className="w-9 h-9 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center font-mono text-xs text-sb-paper/60 hover:text-sb-paper transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink"
          >
            ⊕
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            aria-label="Download markdown file"
            className="w-9 h-9 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center font-mono text-xs text-sb-paper/60 hover:text-sb-paper transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-ink"
          >
            ↓
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
