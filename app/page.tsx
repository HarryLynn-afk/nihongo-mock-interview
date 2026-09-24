import Home from "./components/Home";
import { getLandingView } from "@/lib/server/study/landingView";

export default async function Page() {
  const view = await getLandingView("/");
  return <Home view={view} />;
}
