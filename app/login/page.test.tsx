import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { MAGIC_LINK_COPY } from "@/lib/content/studyAuth";

describe("Login page", () => {
  it("always shows the eligible-copy after submit, never a listed-or-not split", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ message: MAGIC_LINK_COPY }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email"), "tester@school.org");
    await user.click(screen.getByRole("button", { name: "Send sign-in link" }));

    expect(await screen.findByText(MAGIC_LINK_COPY)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/magic-link",
      expect.objectContaining({ method: "POST" }),
    );
    vi.unstubAllGlobals();
  });
});
