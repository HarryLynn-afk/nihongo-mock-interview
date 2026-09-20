import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUsefulnessNudge, USEFULNESS_NUDGE_MS } from "./useUsefulnessNudge";

function Probe({ ready }: { ready: boolean }) {
  const { open, openNow, close } = useUsefulnessNudge(ready);
  return (
    <div>
      <span>{open ? "open" : "closed"}</span>
      <button type="button" onClick={openNow}>
        open now
      </button>
      <button type="button" onClick={close}>
        close
      </button>
    </div>
  );
}

describe("useUsefulnessNudge", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays closed until the nudge delay after ready", async () => {
    vi.useFakeTimers();
    render(<Probe ready />);

    expect(screen.getByText("closed")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(USEFULNESS_NUDGE_MS - 1);
    });
    expect(screen.getByText("closed")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("does not auto-open when ready is false", async () => {
    vi.useFakeTimers();
    render(<Probe ready={false} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(USEFULNESS_NUDGE_MS);
    });
    expect(screen.getByText("closed")).toBeInTheDocument();
  });

  it("does not reopen after Close even if the delay would have fired", async () => {
    vi.useFakeTimers();
    render(<Probe ready />);

    await act(async () => {
      screen.getByRole("button", { name: /open now/i }).click();
    });
    expect(screen.getByText("open")).toBeInTheDocument();

    await act(async () => {
      screen.getByRole("button", { name: /close/i }).click();
    });
    expect(screen.getByText("closed")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(USEFULNESS_NUDGE_MS);
    });
    expect(screen.getByText("closed")).toBeInTheDocument();
  });
});
