import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional override for the fallback UI. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Top-level error boundary.
 *
 * Catches render-phase errors anywhere in the React tree and shows an
 * on-brand "Oops, let's restart" UI instead of a white screen. See PRD §4.4
 * Operational Considerations.
 *
 * Note: this only catches errors during rendering, lifecycle, and constructors.
 * It does NOT catch:
 *   - Errors in event handlers (use try/catch there)
 *   - Errors in async code / setTimeout / Promises (use Promise.catch)
 *   - Server-side rendering errors (we don't SSR)
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // No telemetry in v1 — just console for dev visibility.
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  private reset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div
          role="alert"
          className="min-h-[100dvh] w-full grid place-items-center p-6 text-center bg-sb-surface"
        >
          <div className="max-w-md">
            <div aria-hidden className="text-6xl mb-4">
              🍕💥
            </div>
            <h1 className="font-display text-3xl text-terracotta-600 mb-2">
              Oops! Let&apos;s restart.
            </h1>
            <p className="text-terracotta-600 mb-6">
              Something hiccuped on our end. Freddy&apos;s gonna take a quick
              break.
            </p>
            <button
              type="button"
              onClick={this.reset}
              className="py-3 px-6 rounded-2xl bg-tomato-500 text-white font-display text-lg shadow-lg shadow-tomato-500/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-tomato-400/40"
            >
              Start over
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
