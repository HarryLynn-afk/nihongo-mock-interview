import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SenseiTile } from "./SenseiTile";

describe("SenseiTile", () => {
  it("shows the exact sensei label and the static illustration", () => {
    render(<SenseiTile />);

    expect(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Tokyo Pathway Japanese School"),
    ).not.toBeInTheDocument();

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", expect.stringContaining("tanaka-sensei"));
  });

  it("fills leftover classroom height instead of a tall 16:9 min-height", () => {
    render(<SenseiTile />);

    const tile = screen.getByTestId("sensei-tile");
    expect(tile).toHaveClass("absolute", "inset-0");
    expect(tile).not.toHaveClass("min-h-96");
    expect(tile).not.toHaveClass("aspect-[16/9]");
  });
});
