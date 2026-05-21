import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Guest } from "./Guest";

describe("Guest", () => {
  it("renders the real asset path before any error", () => {
    const { getByRole, getByTestId } = render(
      <Guest id="maya" expression="neutral" displayName="Maya" />,
    );
    const img = getByRole("img");
    expect(img.getAttribute("src")).toBe(
      "/images/characters/guests/maya-neutral.png",
    );
    expect(getByTestId("guest-character").getAttribute("data-expression")).toBe(
      "neutral",
    );
  });

  it("renders a different asset per expression", () => {
    const { getByRole } = render(
      <Guest id="theo" expression="smile" />,
    );
    expect(getByRole("img").getAttribute("src")).toBe(
      "/images/characters/guests/theo-smile.png",
    );
  });

  it("falls back to the styled placeholder when the image errors", () => {
    const { getByRole, getByTestId, queryByRole } = render(
      <Guest id="nonna" expression="frown" displayName="Nonna Lucia" />,
    );
    fireEvent.error(getByRole("img"));
    const root = getByTestId("guest-character");
    expect(root.getAttribute("data-placeholder")).toBe("true");
    expect(root.textContent).toContain("N");
    expect(root.textContent).toContain(":(");
    expect(queryByRole("img")).toBeNull();
  });

  it("uses the id as displayName when none is provided", () => {
    const { getByTestId, getByRole } = render(
      <Guest id="theo" expression="neutral" />,
    );
    fireEvent.error(getByRole("img"));
    expect(getByTestId("guest-character").textContent).toContain("T");
  });

  it("tags the placeholder with guest id + expression for assertion targets", () => {
    const { getByRole, getByTestId } = render(
      <Guest id="maya" expression="smile" />,
    );
    fireEvent.error(getByRole("img"));
    const el = getByTestId("guest-character");
    expect(el.getAttribute("data-guest-id")).toBe("maya");
    expect(el.getAttribute("data-expression")).toBe("smile");
  });
});
