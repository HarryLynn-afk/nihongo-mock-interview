/** @vitest-environment node */
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { DevAppRouteRouteMatcherProvider } from "next/dist/server/route-matcher-providers/dev/dev-app-route-route-matcher-provider";
import { DefaultFileReader } from "next/dist/server/route-matcher-providers/dev/helpers/file-reader/default-file-reader";

it("exposes the score endpoint without the retired grade endpoint", async () => {
  const provider = new DevAppRouteRouteMatcherProvider(
    resolve(process.cwd(), "app"),
    ["tsx", "ts", "jsx", "js"],
    new DefaultFileReader({}),
    false,
  );
  const routes = await provider.matchers();

  expect(routes.some((route) => route.match("/api/score"))).toBe(true);
  expect(routes.some((route) => route.match("/api/grade"))).toBe(false);
});
