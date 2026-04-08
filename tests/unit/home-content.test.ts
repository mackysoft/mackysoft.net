import { describe, expect, test } from "vitest";

import { getHomePageTitle, homePageContent } from "../../src/features/home/content";

describe("homePageContent", () => {
  test("exports the current home page contract", () => {
    expect(getHomePageTitle()).toBe("mackysoft.net");
    expect(homePageContent).toEqual({
      title: "mackysoft.net",
      statusMessage: "Astro minimum bootstrap is ready.",
    });
  });
});
