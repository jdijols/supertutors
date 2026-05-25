import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GuestBox } from "./GuestBox";
import type { SandboxPiece } from "./useSandboxPieces";

function piece(id: string, guestId: string): SandboxPiece {
  return {
    id,
    slot: "whole",
    fraction: "1",
    variant: "pepperoni-v1",
    src: "/lessons/freddy-fractions/images/pizza/pepperoni-v1/whole.png",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    guestId,
  };
}

describe("GuestBox", () => {
  it("renders with the guest id exposed as a data attribute", () => {
    render(
      <GuestBox guestId="maya" label="Maya" x={100} y={50} pieces={[]} />,
    );
    const box = screen.getByTestId("guest-box");
    expect(box.dataset.guestId).toBe("maya");
  });

  it("renders the label text visibly so the kid knows whose box it is", () => {
    render(<GuestBox guestId="maya" label="Maya" x={0} y={0} pieces={[]} />);
    expect(screen.getByText("Maya")).toBeDefined();
  });

  it("renders no piece content when assigned pieces is empty", () => {
    render(<GuestBox guestId="maya" label="Maya" x={0} y={0} pieces={[]} />);
    const contents = screen.getByTestId("guest-box-contents");
    expect(contents.children).toHaveLength(0);
  });

  it("renders one img per assigned piece inside the box", () => {
    const pieces = [
      piece("p1", "maya"),
      piece("p2", "maya"),
      piece("p3", "maya"),
    ];
    render(
      <GuestBox guestId="maya" label="Maya" x={0} y={0} pieces={pieces} />,
    );
    const contents = screen.getByTestId("guest-box-contents");
    expect(contents.children).toHaveLength(3);
  });

  it("positions the box at the given x/y coordinates", () => {
    render(
      <GuestBox guestId="maya" label="Maya" x={123} y={456} pieces={[]} />,
    );
    const box = screen.getByTestId("guest-box") as HTMLDivElement;
    expect(box.style.left).toBe("123px");
    expect(box.style.top).toBe("456px");
  });

  it("uses the default size of 200px when no size prop is given", () => {
    render(<GuestBox guestId="maya" label="Maya" x={0} y={0} pieces={[]} />);
    const box = screen.getByTestId("guest-box") as HTMLDivElement;
    expect(box.style.width).toBe("200px");
    expect(box.style.height).toBe("200px");
  });

  it("respects an explicit size prop", () => {
    render(
      <GuestBox
        guestId="maya"
        label="Maya"
        x={0}
        y={0}
        pieces={[]}
        size={300}
      />,
    );
    const box = screen.getByTestId("guest-box") as HTMLDivElement;
    expect(box.style.width).toBe("300px");
    expect(box.style.height).toBe("300px");
  });
});
