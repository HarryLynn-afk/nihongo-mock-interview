import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SenseiTile } from "./SenseiTile";

describe("SenseiTile", () => {
  it("shows the exact sensei label, the school name, and the static illustration", () => {
    render(<SenseiTile />);

    expect(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    ).toBeInTheDocument();
    expect(screen.getByText("Tokyo Pathway Japanese School")).toBeInTheDocument();

    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", expect.stringContaining("tanaka-sensei"));
  });
});
