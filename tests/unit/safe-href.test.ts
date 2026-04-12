import { describe, expect, test } from "vitest";

import { isExternalHttpHref, isInternalHref, isValidActionHref } from "../../src/lib/safe-href";

describe("safe href helpers", () => {
  test("treats site-relative links as internal", () => {
    expect(isInternalHref("/privacy-policy/")).toBe(true);
    expect(isExternalHttpHref("/privacy-policy/")).toBe(false);
    expect(isExternalHttpHref("/games/treasure-rogue/press-kit/")).toBe(false);
    expect(isExternalHttpHref("https://unityroom.com/games/treasure-rogue")).toBe(true);
  });

  test("accepts only safe action hrefs", () => {
    expect(isValidActionHref("/privacy-policy/")).toBe(true);
    expect(isValidActionHref("https://unityroom.com/games/treasure-rogue")).toBe(true);
    expect(isValidActionHref("//example.com")).toBe(false);
    expect(isValidActionHref("javascript:alert(1)")).toBe(false);
    expect(isValidActionHref("data:text/html,hello")).toBe(false);
    expect(isExternalHttpHref("//example.com")).toBe(false);
  });
});
