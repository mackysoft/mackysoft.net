import { describe, expect, test } from "vitest";

import { buildSiteLayoutUrls, requireSiteUrl, toAbsoluteSiteUrl } from "../../src/lib/site-url.mjs";

describe("site URL helpers", () => {
  test("builds canonical, RSS, and alternate URLs from the provided site", () => {
    const site = new URL("https://preview.example.com");

    expect(buildSiteLayoutUrls(site, {
      canonicalPath: "/articles/vision-introduction/",
      alternateLocales: [
        { locale: "ja", path: "/articles/vision-introduction/" },
        { locale: "en", path: "/en/articles/vision-introduction/" },
      ],
    })).toEqual({
      canonicalUrl: toAbsoluteSiteUrl(site, "/articles/vision-introduction/"),
      rssFeedUrl: toAbsoluteSiteUrl(site, "/feed.xml"),
      alternateLocaleUrls: [
        { locale: "ja", path: "/articles/vision-introduction/", href: toAbsoluteSiteUrl(site, "/articles/vision-introduction/") },
        { locale: "en", path: "/en/articles/vision-introduction/", href: toAbsoluteSiteUrl(site, "/en/articles/vision-introduction/") },
      ],
    });
  });

  test("normalizes string site values and rejects missing site values", () => {
    expect(toAbsoluteSiteUrl("https://preview.example.com", "/feed.xml")).toBe("https://preview.example.com/feed.xml");
    expect(() => requireSiteUrl(undefined, "site is required")).toThrow("site is required");
  });
});
