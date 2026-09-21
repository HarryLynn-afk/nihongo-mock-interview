import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";
import { MAGIC_LINK_COPY } from "@/lib/content/studyAuth";

describe("Login page", () => {
  it("starts allowlisted Google through POST /api/auth/login-google", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ url: "https://accounts.google.com/oauth" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const assign = vi.fn();
    vi.stubGlobal("location", { assign });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Continue with Google" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/login-google",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith("https://accounts.google.com/oauth");
    });
    vi.unstubAllGlobals();
  });

  it("shows an error message when Google sign-in is rejected as not invited", async () => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      search: "?error=not_invited",
    });
    render(<LoginPage />);

    expect(
      await screen.findByText("This Google account is not in the invited-tester list."),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

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
