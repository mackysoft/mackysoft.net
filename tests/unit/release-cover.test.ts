import { describe, expect, test } from "vitest";

import { normalizeReleaseCoverPublicPath, resolveReleaseCoverImage } from "../../src/features/releases/cover-image";

describe("release cover helpers", () => {
  test("normalizes localized public covers into stable public paths", () => {
    expect(
      normalizeReleaseCoverPublicPath("/generated/activity-covers/github/example.png?v=abc123"),
    ).toBe("/generated/activity-covers/github/example.png");
  });

  test("keeps external release covers as absolute URLs", () => {
    expect(
      resolveReleaseCoverImage("https://opengraph.githubassets.com/example", "https://mackysoft.net"),
    ).toEqual({
      kind: "remote",
      src: "https://opengraph.githubassets.com/example",
    });
  });
});
