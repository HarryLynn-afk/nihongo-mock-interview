import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
}));

describe("Login page", () => {
  it("opens Participant login as a dialog over the start screen, with Google only", () => {
    render(<LoginPage />);

    const dialog = screen.getByRole("dialog", { name: "Sign in to NihonGo" });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Try a short practice" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        "Guest practice stays on the start screen and is never merged into the study.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Practice your Japanese language-school interview",
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request an invite" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send sign-in link" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Or send a sign-in link")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /github/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /create an account/i }),
    ).not.toBeInTheDocument();
  });

  it("starts allowlisted Google through POST /api/auth/login-google", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ url: "https://accounts.google.com/oauth" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const assign = vi.fn();
    vi.stubGlobal("location", { assign, search: "", hash: "" });
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
      hash: "",
    });
    render(<LoginPage />);

    expect(
      await screen.findByText("This Google account is not in the invited-tester list."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/already opened or has expired/i),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("offers to request an invite when the Google account is not invited", async () => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      search: "?error=not_invited",
      hash: "",
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(
      await screen.findByRole("button", { name: "Request an invite" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Ask for the full Interview" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Sign in to NihonGo" }),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("confirms the invite request from the not-invited dialog", async () => {
    vi.stubGlobal("location", {
      assign: vi.fn(),
      search: "?error=not_invited",
      hash: "",
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(
      await screen.findByRole("button", { name: "Request an invite" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: /email/i }),
      "ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(
      await screen.findByRole("dialog", { name: /you will get an email/i }),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("closes back to the start screen from the close control, Escape, and the backdrop", async () => {
    replaceMock.mockReset();
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(replaceMock).toHaveBeenCalledWith("/", { scroll: false });

    replaceMock.mockReset();
    await user.keyboard("{Escape}");
    expect(replaceMock).toHaveBeenCalledWith("/", { scroll: false });

    replaceMock.mockReset();
    const scrim = screen.getByRole("dialog", { name: "Sign in to NihonGo" })
      .parentElement;
    expect(scrim).not.toBeNull();
    fireEvent.mouseDown(scrim!);
    expect(replaceMock).toHaveBeenCalledWith("/", { scroll: false });
  });
});
