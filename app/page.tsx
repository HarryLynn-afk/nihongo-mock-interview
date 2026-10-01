import Home from "./components/Home";
import { HashSessionCatcher } from "./auth/HashSessionCatcher";
import { getLandingView } from "@/lib/server/study/landingView";

export default async function Page() {
  const view = await getLandingView("/");
  return (
    <>
      <HashSessionCatcher idle />
      <Home view={view} />
    </>
  );
}
