import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pizza } from "./Pizza";

describe("Pizza", () => {
  it("renders an <img> with the supplied src", () => {
    render(<Pizza src="/images/pizza/pepperoni-v1/whole.png" />);
    const img = screen.getByTestId("pizza");
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute(
      "src",
      "/images/pizza/pepperoni-v1/whole.png",
    );
  });

  it("exposes the fraction value via a data attribute for state-machine assertions", () => {
    render(<Pizza src="/whatever.png" fraction="1/4" />);
    expect(screen.getByTestId("pizza")).toHaveAttribute(
      "data-fraction",
      "1/4",
    );
  });

  it("derives a fraction-aware default alt text when alt is omitted", () => {
    const { rerender } = render(<Pizza src="/x.png" fraction="1" />);
    expect(
      screen.getByRole("img", { name: /whole pizza/i }),
    ).toBeInTheDocument();

    rerender(<Pizza src="/x.png" fraction="1/2" />);
    expect(
      screen.getByRole("img", { name: /half pizza slice/i }),
    ).toBeInTheDocument();

    rerender(<Pizza src="/x.png" fraction="1/8" />);
    expect(
      screen.getByRole("img", { name: /eighth pizza slice/i }),
    ).toBeInTheDocument();

    // 1/3 is a display-only fraction (for the Beat 3 vocab lesson) — not
    // part of the bisect slicing tree but still a renderable Pizza piece.
    rerender(<Pizza src="/x.png" fraction="1/3" />);
    expect(
      screen.getByRole("img", { name: /third pizza slice/i }),
    ).toBeInTheDocument();
  });

  it("uses an explicit alt when provided, overriding the default", () => {
    render(
      <Pizza src="/x.png" fraction="1" alt="A fresh pepperoni pie" />,
    );
    expect(
      screen.getByRole("img", { name: /a fresh pepperoni pie/i }),
    ).toBeInTheDocument();
  });

  it("defaults height to width when only width is provided (square aspect)", () => {
    render(<Pizza src="/x.png" width={300} />);
    const img = screen.getByTestId("pizza");
    expect(img).toHaveAttribute("width", "300");
    expect(img).toHaveAttribute("height", "300");
  });

  it("honors an explicit height when provided (rectangular pieces)", () => {
    render(<Pizza src="/x.png" width={150} height={300} />);
    const img = screen.getByTestId("pizza");
    expect(img).toHaveAttribute("width", "150");
    expect(img).toHaveAttribute("height", "300");
  });

  it("renders without a fraction attribute when none is supplied", () => {
    render(<Pizza src="/x.png" />);
    expect(screen.getByTestId("pizza")).not.toHaveAttribute("data-fraction");
  });
});
