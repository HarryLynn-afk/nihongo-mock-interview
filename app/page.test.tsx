import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { UI_LOCALE_STORAGE_KEY } from "@/lib/content/locale";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("Home (start screen)", () => {
  const getUserMedia = vi.fn();

  beforeEach(() => {
    pushMock.mockReset();
    getUserMedia.mockResolvedValue({
      getTracks: () => [],
    } as unknown as MediaStream);
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    getUserMedia.mockReset();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("shows the NihonGo header and dual CTAs without a Profile card or Ready to join dialog", () => {
    render(<Home />);

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Practice your interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Speak real interview questions in Japanese and get a coaching report back.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try as guest" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Guest practice isn't saved.")).toBeInTheDocument();
    const loginLinks = screen.getAllByRole("link", {
      name: "Participant login",
    });
    expect(loginLinks).toHaveLength(2);
    for (const link of loginLinks) {
      expect(link).toHaveAttribute("href", "/login");
    }
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Practice" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "How it works" })).toHaveAttribute(
      "href",
      "#how-it-works",
    );
    expect(
      screen.getByRole("heading", { name: "How it works" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Camera optional", { selector: "span" })).toHaveClass(
      "rounded-full",
    );
    expect(screen.getByText("Speak in Japanese", { selector: "span" })).toHaveClass(
      "rounded-full",
    );
    expect(screen.getByText("Coaching report", { selector: "span" })).toHaveClass(
      "rounded-full",
    );
    expect(screen.getByText("10–15 min", { selector: "span" })).toHaveClass(
      "rounded-full",
    );
    expect(screen.getByText("Tanaka-sensei")).toBeInTheDocument();
    expect(
      screen.queryByText("Tokyo Pathway Japanese School"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Japanese language school interview practice"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Check your camera and mic"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Aung Min Khant")).not.toBeInTheDocument();
    expect(screen.queryByText("Mandalay, Myanmar")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /ready to join/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ENG" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("places Try as guest and Participant login in an equal-width row on desktop", () => {
    render(<Home />);

    const guest = screen.getByRole("button", { name: "Try as guest" });
    const heroLogin = screen
      .getAllByRole("link", { name: "Participant login" })
      .find((link) => link.className.includes("md:flex-1"));

    expect(heroLogin).toBeDefined();
    expect(guest.parentElement).toBe(heroLogin?.parentElement);
    expect(guest.parentElement).toHaveClass("md:flex-row");
    expect(guest).toHaveClass("md:flex-1");
    expect(heroLogin).toHaveClass("md:flex-1");
  });

  it("opens the device popup on the start screen after Try as guest, with no timer", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Japanese interview with Tanaka-sensei",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("classroom-preview")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /camera/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /microphone/i })).not.toBeChecked();
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /enter classroom/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /interview will start soon/i })).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("asks for the camera when the Camera box is clicked", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));
    await user.click(screen.getByRole("checkbox", { name: /camera/i }));

    expect(getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(getUserMedia).not.toHaveBeenCalledWith({ audio: true });
    expect(screen.getByRole("checkbox", { name: /camera/i })).toBeChecked();
  });

  it("Enter classroom keeps the lobby and shows the start popup", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));
    await user.click(screen.getByRole("button", { name: /enter classroom/i }));

    expect(screen.getByRole("dialog", { name: /ready to join/i })).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("start-reminder-backdrop")).toHaveClass(
      "bg-ink/80",
    );
    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("Skip on the start popup navigates to the call screen", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));
    await user.click(screen.getByRole("button", { name: /enter classroom/i }));
    await user.click(screen.getByRole("button", { name: /^skip$/i }));

    expect(
      screen.getByRole("dialog", { name: /interview will start soon/i }),
    ).toBeInTheDocument();
    expect(pushMock).toHaveBeenCalledWith("/call?guest=1");
  });

  it("gates Join behind a desktop viewport and shows the open-on-a-computer message on narrow viewports, via a CSS breakpoint pair", () => {
    render(<Home />);

    const joinButton = screen.getByRole("button", { name: "Try as guest" });
    const joinContainer = joinButton.parentElement;
    const desktopOnlyMessage = screen.getByText(
      "Open on a computer to join the interview.",
    );

    expect(joinContainer).toHaveClass("hidden", "md:flex");
    expect(desktopOnlyMessage).toHaveClass("md:hidden");
    expect(desktopOnlyMessage).not.toHaveClass("hidden");
  });

  it("switches start-screen copy to Burmese when MM is selected", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "MM" }));

    expect(screen.getByRole("button", { name: "MM" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("heading", {
        name: "Tanaka-sensei နှင့် အင်တာဗျူး လေ့ကျင့်ပါ",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ဧည့်သည်အဖြစ် စမ်းကြည့်ရန်" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "ပါဝင်သူ ဝင်ရောက်ရန်" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "လေ့ကျင့်ရန်" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "အလုပ်လုပ်ပုံ" })).toBeInTheDocument();
    expect(sessionStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe("my");

    await user.click(
      screen.getByRole("button", { name: "ဧည့်သည်အဖြစ် စမ်းကြည့်ရန်" }),
    );
    expect(
      screen.getByRole("dialog", { name: "ဝင်ရန် အဆင်သင့်" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Tanaka-sensei နှင့် ဂျပန် အင်တာဗျူး",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "စာသင်ခန်းထဲ ဝင်ရန်" }),
    ).toBeInTheDocument();
  });

  it("never prints exam or verdict labels anywhere on the page", () => {
    render(<Home />);

    const pageText = document.body.textContent ?? "";

    for (const term of [/N5/, /JLPT/, /\bA1\b/, /\bPass\b/, /\bFail\b/]) {
      expect(pageText).not.toMatch(term);
    }
  });

  it("never renders a sign-up, password, or email field", () => {
    render(<Home />);

    expect(document.querySelectorAll("input, form").length).toBe(0);
  });
});
