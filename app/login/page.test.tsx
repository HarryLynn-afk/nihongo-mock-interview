import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

describe("Login page", () => {
  it("offers Continue with Google and no email sign-in link form", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send sign-in link" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Or send a sign-in link")).not.toBeInTheDocument();
  });

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
});
