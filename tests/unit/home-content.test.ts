import { describe, expect, test } from "vitest";

import { getHomePageTitle, homePageContent } from "../../src/features/home/content";

describe("homePageContent", () => {
  test("exports the current home page contract", () => {
    expect(getHomePageTitle()).toBe("mackysoft.net");
    expect(homePageContent.title).toBe("mackysoft.net");
    expect(homePageContent.heroLabel).toBe("静かな技術系ポートフォリオ");
    expect(homePageContent.role).toBe("Game Developer / Engineer");
    expect(homePageContent.intro).toHaveLength(2);
  });
});
