"use client";

import Home from "../components/Home";
import { ParticipantLoginDialog } from "../components/ParticipantLoginDialog";

/**
 * Hard visits (refresh, bookmark, middleware redirect) render the start
 * screen behind the same dialog. Soft navigations from `/` are intercepted
 * by `app/@modal/(.)login` so this page does not remount the start screen.
 */
export default function LoginPage() {
  return (
    <>
      <div inert>
        <Home catchAuth={false} />
      </div>
      <ParticipantLoginDialog />
    </>
  );
}
