import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsentPage from "./page";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../components/JoinInterview", () => ({
  JoinInterview: () => <button type="button">Join interview</button>,
}));

describe("Study consent page", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    pushMock.mockReset();
  });

  it("keeps Agree disabled until the checkbox is ticked", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<ConsentPage />);

    const agree = screen.getByRole("button", { name: "Agree and continue" });
    expect(agree).toBeDisabled();
    expect(
      screen.getByText(/I agree to take part and to save this session/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Join interview" }),
    ).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows Join only after the checkbox and Agree and continue", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ participantId: "P001" }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ConsentPage />);

    const agree = screen.getByRole("button", { name: "Agree and continue" });
    await user.click(agree);
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/study/consent",
      expect.objectContaining({ method: "POST" }),
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: /I agree to take part and to save this session/,
      }),
    );
    await user.click(agree);

    expect(await screen.findByRole("button", { name: "Join interview" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/study/consent",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
