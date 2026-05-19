import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * Suppress the React-emitted error log during these tests. We're
 * intentionally throwing, and React logs a noisy stack to console.error
 * even when the boundary handles it cleanly. Restore after each test.
 */
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleErrorSpy.mockRestore();
});

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("kaboom");
  }
  return <div>safe</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <div>hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders the fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /restart/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start over/i })).toBeInTheDocument();
  });

  it("calls the custom fallback when provided", () => {
    render(
      <ErrorBoundary
        fallback={(error) => <div role="alert">custom: {error.message}</div>}
      >
        <Boom shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/custom: kaboom/)).toBeInTheDocument();
  });

  it("can be reset back to the children once the source stops throwing", async () => {
    const user = userEvent.setup();
    function Toggle() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <ErrorBoundary
          fallback={(_error, reset) => (
            <div role="alert">
              <button
                type="button"
                onClick={() => {
                  setShouldThrow(false);
                  reset();
                }}
              >
                fix and reset
              </button>
            </div>
          )}
        >
          <Boom shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    render(<Toggle />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /fix and reset/i }));
    expect(screen.getByText("safe")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
