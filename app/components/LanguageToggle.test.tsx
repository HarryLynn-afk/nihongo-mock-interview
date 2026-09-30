import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageToggle } from "./LanguageToggle";

describe("LanguageToggle", () => {
  it("shows English and မြန်မာ on the top-right language control", () => {
    render(<LanguageToggle locale="en" onChange={() => {}} />);

    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "မြန်မာ" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("notifies when မြန်မာ is chosen", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LanguageToggle locale="en" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "မြန်မာ" }));

    expect(onChange).toHaveBeenCalledWith("my");
  });
});
