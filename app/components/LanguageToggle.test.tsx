import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageToggle } from "./LanguageToggle";

describe("LanguageToggle", () => {
  it("shows ENG and MM on the top-right language control", () => {
    render(<LanguageToggle locale="en" onChange={() => {}} />);

    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ENG" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "MM" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("notifies when MM is chosen", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LanguageToggle locale="en" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "MM" }));

    expect(onChange).toHaveBeenCalledWith("my");
  });
});
