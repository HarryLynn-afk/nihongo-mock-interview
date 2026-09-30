import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./components/Home";
import { UI_LOCALE_STORAGE_KEY } from "@/lib/content/locale";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("Home (start screen)", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  afterEach(() => {
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
    expect(
      screen.getByText("Three questions. Guest practice isn't saved."),
    ).toBeInTheDocument();
    const loginLink = screen.getByRole("link", { name: "Login" });
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(
      screen.queryByRole("navigation", { name: "Primary" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Practice" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "How it works" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "How it works" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Camera optional")).not.toBeInTheDocument();
    expect(screen.queryByText("Speak in Japanese")).not.toBeInTheDocument();
    expect(screen.queryByText("Coaching report")).not.toBeInTheDocument();
    expect(screen.queryByText("10–15 min")).not.toBeInTheDocument();
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

  it("shows Join interview, guest practice, and Profile after Google sign-in", () => {
    render(
      <Home
        view={{
          kind: "signedIn",
          origin: "/join?from=T1",
          consentedThisVisit: false,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Join interview" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try as guest" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Participant login" })).not.toBeInTheDocument();
  });

  it("keeps Login in the header only, with a single Try as guest CTA", () => {
    render(<Home />);

    const guest = screen.getByRole("button", { name: "Try as guest" });
    const login = screen.getByRole("link", { name: "Login" });

    expect(login).toHaveAttribute("href", "/login");
    expect(guest.parentElement).not.toBe(login.parentElement);
    expect(guest.parentElement).toHaveClass("justify-center");
  });

  it("styles the Login pill the same as the signed-in Profile pill", () => {
    const { unmount } = render(<Home />);
    const login = screen.getByRole("link", { name: "Login" });
    unmount();

    render(
      <Home
        view={{
          kind: "signedIn",
          origin: "/join?from=T1",
          consentedThisVisit: false,
        }}
      />,
    );
    const profile = screen.getByRole("link", { name: "Profile" });

    for (const pillClass of [
      "min-h-11",
      "px-4",
      "rounded-full",
      "bg-[#d8f5b0]",
      "text-feather-dark",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-feather",
    ]) {
      expect(login).toHaveClass(pillClass);
      expect(profile).toHaveClass(pillClass);
    }
  });

  it("places Login to the right of the language control in the header", () => {
    render(<Home />);

    const header = screen.getByRole("banner");
    const login = within(header).getByRole("link", { name: "Login" });
    const language = within(header).getByRole("group", { name: "Language" });
    expect(
      login.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it("places Profile to the right of the language control after sign-in", () => {
    render(
      <Home
        view={{
          kind: "signedIn",
          origin: "/join?from=T1",
          consentedThisVisit: false,
        }}
      />,
    );

    const header = screen.getByRole("banner");
    const profile = within(header).getByRole("link", { name: "Profile" });
    const language = within(header).getByRole("group", { name: "Language" });
    expect(
      profile.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
  });

  it("Try as guest opens the device popup on the landing, with no email dialog", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "Try as guest" }));

    expect(screen.getByText("NihonGo")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: /how do you want to practice/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /ready to join/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("classroom-preview")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
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
      screen.getAllByRole("link", { name: "ဝင်ရောက်ရန်" }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "လေ့ကျင့်ရန်" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "အလုပ်လုပ်ပုံ" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "အလုပ်လုပ်ပုံ" }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe("my");

    await user.click(
      screen.getByRole("button", { name: "ဧည့်သည်အဖြစ် စမ်းကြည့်ရန်" }),
    );
    expect(
      screen.queryByRole("dialog", { name: "ဘယ်လို လေ့ကျင့်မလဲ။" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "ဝင်ရန် အဆင်သင့်" }),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
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

  it("renders the given hero and omits Participant login when headerAction is null", () => {
    render(
      <Home
        hero={<button type="button">Login</button>}
        headerAction={null}
        catchAuth={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try as guest" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Participant login" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Three questions. Guest practice isn't saved."),
    ).not.toBeInTheDocument();
  });
});
