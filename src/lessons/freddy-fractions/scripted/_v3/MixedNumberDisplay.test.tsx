import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MixedNumberDisplay } from "./MixedNumberDisplay";

describe("MixedNumberDisplay", () => {
  it("renders just the whole number when no fraction is given", () => {
    render(<MixedNumberDisplay whole={2} />);
    expect(screen.getByTestId("mixed-number-whole").textContent).toBe("2");
    expect(screen.queryByTestId("mixed-number-fraction")).toBeNull();
  });

  it("renders just the fraction when no whole is given", () => {
    render(<MixedNumberDisplay numerator={1} denominator={4} />);
    expect(screen.queryByTestId("mixed-number-whole")).toBeNull();
    expect(screen.getByTestId("mixed-number-numerator").textContent).toBe("1");
    expect(screen.getByTestId("mixed-number-denominator").textContent).toBe(
      "4",
    );
  });

  it("renders a mixed number when whole + numerator + denominator are all set", () => {
    render(<MixedNumberDisplay whole={2} numerator={1} denominator={2} />);
    expect(screen.getByTestId("mixed-number-whole").textContent).toBe("2");
    expect(screen.getByTestId("mixed-number-numerator").textContent).toBe("1");
    expect(screen.getByTestId("mixed-number-denominator").textContent).toBe(
      "2",
    );
  });

  it("renders only the whole when fraction has only numerator (incomplete)", () => {
    render(<MixedNumberDisplay whole={2} numerator={1} />);
    expect(screen.getByTestId("mixed-number-whole").textContent).toBe("2");
    expect(screen.queryByTestId("mixed-number-fraction")).toBeNull();
  });
});
