import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { resetUiLocaleForTests } from "./app/components/useUiLocale";

afterEach(() => {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.clear();
  }
  resetUiLocaleForTests();
});

