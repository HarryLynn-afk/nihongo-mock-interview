import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FULL_SESSION_REQUEST_KEY } from "@/lib/content/fullSessionRequest";
import { FullSessionRequestDialog } from "./FullSessionRequestDialog";

describe("FullSessionRequestDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("sends the address and shows that an email will follow", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const onSent = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <FullSessionRequestDialog step="form" onClose={vi.fn()} onSent={onSent} />,
    );

    await user.type(screen.getByRole("textbox", { name: /email/i }), "Ada@Example.com");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/full-session-request",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).body as string,
    );
    expect(body.email).toBe("ada@example.com");
    expect(sessionStorage.getItem(FULL_SESSION_REQUEST_KEY)).toBe("sent");
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: /leave an email/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /how do you want to practice/i }),
    ).not.toBeInTheDocument();

    rerender(<FullSessionRequestDialog step="saved" onClose={vi.fn()} />);
    expect(
      screen.getByRole("dialog", { name: /you will get an email/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue as guest/i }),
    ).not.toBeInTheDocument();
  });

  it("keeps the form open when the save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );
    const onSent = vi.fn();
    const user = userEvent.setup();
    render(
      <FullSessionRequestDialog step="form" onClose={vi.fn()} onSent={onSent} />,
    );

    await user.type(screen.getByRole("textbox", { name: /email/i }), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /^send$/i }));

    expect(onSent).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(FULL_SESSION_REQUEST_KEY)).toBeNull();
    expect(screen.getByText(/could not be saved/i)).toBeInTheDocument();
  });

  it("closes from the backdrop without saving", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<FullSessionRequestDialog step="form" onClose={onClose} />);

    await user.click(screen.getByTestId("full-session-request-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders as a light brand dialog", () => {
    render(<FullSessionRequestDialog step="form" onClose={vi.fn()} />);

    const dialog = screen.getByTestId("full-session-request");
    expect(dialog).toHaveClass("bg-white");
    expect(dialog).toHaveClass("text-eel");
    expect(dialog).not.toHaveClass("bg-ink");
  });
});
