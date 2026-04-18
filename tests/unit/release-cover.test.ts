import { describe, expect, test } from "vitest";

import { resolveReleaseCoverImageUrl } from "../../src/features/releases/cover-image";

describe("release cover helpers", () => {
  test("keeps localized public covers as root-relative public paths", () => {
    expect(
      resolveReleaseCoverImageUrl("/generated/activity-covers/github/example.png?v=abc123", "https://mackysoft.net"),
    ).toBe("/generated/activity-covers/github/example.png");
  });

  test("keeps external release covers as absolute URLs", () => {
    expect(
      resolveReleaseCoverImageUrl("https://opengraph.githubassets.com/example", "https://mackysoft.net"),
    ).toBe("https://opengraph.githubassets.com/example");
  });
});
