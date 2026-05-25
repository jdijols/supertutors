import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PizzaPiece } from "./PizzaPiece";

const DEFAULT_PROPS = {
  id: "p1",
  src: "/lessons/freddy-fractions/images/pizza/pepperoni-v1/whole.png",
  fraction: "1" as const,
  initialX: 100,
  initialY: 200,
  width: 220,
  height: 220,
};

describe("PizzaPiece", () => {
  it("renders the underlying Pizza with src + fraction", () => {
    render(<PizzaPiece {...DEFAULT_PROPS} />);
    const pizza = screen.getByTestId("pizza");
    expect(pizza).toHaveAttribute(
      "src",
      "/lessons/freddy-fractions/images/pizza/pepperoni-v1/whole.png",
    );
    expect(pizza).toHaveAttribute("data-fraction", "1");
  });

  it("exposes piece id and fraction as data attributes on the wrapper", () => {
    render(<PizzaPiece {...DEFAULT_PROPS} id="abc-123" fraction="1/4" />);
    const piece = screen.getByTestId("pizza-piece");
    expect(piece).toHaveAttribute("data-piece-id", "abc-123");
    expect(piece).toHaveAttribute("data-fraction", "1/4");
  });

  it("positions itself absolutely with transform-driven motion values", () => {
    // The element uses `position: absolute, left: 0, top: 0` and applies its
    // actual position via the `x`/`y` motion values (CSS transform). We
    // assert the absolute positioning + that no `left`/`top` is being used
    // to drive position — that's intentional, since framer-motion's drag
    // already manipulates the transform.
    render(<PizzaPiece {...DEFAULT_PROPS} initialX={42} initialY={84} />);
    const piece = screen.getByTestId("pizza-piece");
    expect(piece).toHaveStyle({
      position: "absolute",
      left: "0px",
      top: "0px",
    });
  });

  it("fires onTap with the piece id when clicked without drag", async () => {
    const user = userEvent.setup();
    const handleTap = vi.fn();
    render(<PizzaPiece {...DEFAULT_PROPS} onTap={handleTap} />);

    await user.click(screen.getByTestId("pizza-piece"));
    expect(handleTap).toHaveBeenCalledTimes(1);
    expect(handleTap).toHaveBeenCalledWith("p1");
  });

  it("applies the cursor override style when provided", () => {
    render(<PizzaPiece {...DEFAULT_PROPS} cursor="crosshair" />);
    expect(screen.getByTestId("pizza-piece")).toHaveStyle({
      cursor: "crosshair",
    });
  });

  it("renders at the requested width and height", () => {
    render(<PizzaPiece {...DEFAULT_PROPS} width={180} height={360} />);
    const piece = screen.getByTestId("pizza-piece");
    expect(piece).toHaveStyle({
      width: "180px",
      height: "360px",
    });
    const pizza = screen.getByTestId("pizza");
    expect(pizza).toHaveAttribute("width", "180");
    expect(pizza).toHaveAttribute("height", "360");
  });

  it("does not crash when onTap is omitted (tap is a no-op)", async () => {
    const user = userEvent.setup();
    render(<PizzaPiece {...DEFAULT_PROPS} />);
    await user.click(screen.getByTestId("pizza-piece"));
    // Reaching this line without throwing is the assertion.
    expect(screen.getByTestId("pizza-piece")).toBeInTheDocument();
  });
});
