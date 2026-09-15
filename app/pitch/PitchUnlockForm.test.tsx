import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PitchUnlockForm } from "./PitchUnlockForm";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("PitchUnlockForm", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an access-key form and no Start demo button", () => {
    render(<PitchUnlockForm />);

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(screen.getByText("Pitch mode")).toBeInTheDocument();
    expect(screen.getByLabelText(/access key/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unlock/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start demo/i }),
    ).not.toBeInTheDocument();
  });

  it("refreshes after a matching key and shows an error after a miss", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    render(<PitchUnlockForm />);
    await user.type(screen.getByLabelText(/access key/i), "oral-exam-demo-key");
    await user.click(screen.getByRole("button", { name: /unlock/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pitch/unlock",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ key: "oral-exam-demo-key" }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false }), { status: 401 }),
    );
    await user.clear(screen.getByLabelText(/access key/i));
    await user.type(screen.getByLabelText(/access key/i), "nope");
    await user.click(screen.getByRole("button", { name: /unlock/i }));

    expect(screen.getByText("That key did not work.")).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("never prints exam or verdict labels", () => {
    render(<PitchUnlockForm />);
    const pageText = document.body.textContent ?? "";
    for (const term of [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/]) {
      expect(pageText).not.toMatch(term);
    }
  });
});
