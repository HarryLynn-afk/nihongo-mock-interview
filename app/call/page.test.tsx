import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CallPage from "./page";

describe("Call screen", () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    getUserMedia.mockResolvedValue({} as MediaStream);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
  });

  it("renders both the student tile and the sensei tile on an Ink background with Indigo accents", () => {
    render(<CallPage />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    ).toBeInTheDocument();

    const root = screen.getByTestId("call-screen");
    expect(root).toHaveClass("bg-ink");
  });

  it("still starts the interview (both tiles render, no crash) when camera permission is denied", async () => {
    getUserMedia.mockRejectedValue(new DOMException("Denied", "NotAllowedError"));

    render(<CallPage />);

    await waitFor(() => {
      expect(screen.getByText(/camera off/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText("Tanaka-sensei · AI · Admissions"),
    ).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });
});
