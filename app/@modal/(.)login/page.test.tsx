import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginModalPage from "./page";

const { backMock } = vi.hoisted(() => ({ backMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: backMock }),
}));

describe("Login modal intercept", () => {
  it("shows the Participant login dialog without remounting the start screen", async () => {
    backMock.mockReset();
    const user = userEvent.setup();
    render(<LoginModalPage />);

    expect(
      screen.getByRole("dialog", { name: "Sign in to NihonGo" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Practice your Japanese language-school interview",
      }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(backMock).toHaveBeenCalledOnce();
  });
});
