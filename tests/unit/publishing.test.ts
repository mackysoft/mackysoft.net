import { describe, expect, test } from "vitest";

import { getFeedLastBuildDate, selectPublicLocalArticles, toRssFeedItems } from "../../src/lib/publishing/feed";
import { renderLlmsTxt, renderRobotsTxt } from "../../src/lib/publishing/public-text";
import { buildSitemapEntries } from "../../src/lib/publishing/sitemap";
import { toAbsoluteSiteUrl } from "../../src/lib/site-url.mjs";

describe("publishing helpers", () => {
  test("selects only public local articles for the feed", () => {
    const articles = selectPublicLocalArticles([
      {
        slug: "vision-introduction",
        title: "Vision",
        description: "Published local article.",
        publishedAt: new Date("2021-03-16T00:00:00+09:00"),
        updatedAt: new Date("2021-03-18T00:00:00+09:00"),
        tags: ["Unity"],
        draft: false,
        kind: "local",
      },
      {
        slug: "ray",
        title: "Ray",
        description: "Draft local article.",
        publishedAt: new Date("2020-06-22T20:53:10+09:00"),
        tags: [],
        draft: true,
        kind: "local",
      },
      {
        slug: "zenn-post",
        title: "External article",
        description: "Published outside this site.",
        publishedAt: new Date("2026-01-18T14:37:19Z"),
        tags: [],
        draft: false,
        kind: "external",
      },
    ]);

    expect(articles).toEqual([
      {
        slug: "vision-introduction",
        title: "Vision",
        description: "Published local article.",
        publishedAt: new Date("2021-03-16T00:00:00+09:00"),
        updatedAt: new Date("2021-03-18T00:00:00+09:00"),
        tags: ["Unity"],
        path: "/articles/vision-introduction/",
      },
    ]);

    expect(toRssFeedItems(articles)).toEqual([
      {
        title: "Vision",
        description: "Published local article.",
        link: "/articles/vision-introduction/",
        pubDate: new Date("2021-03-16T00:00:00+09:00"),
        categories: ["Unity"],
      },
    ]);
  });

  test("uses the newest updated or published date as the feed last build date", () => {
    const lastBuildDate = getFeedLastBuildDate([
      {
        publishedAt: new Date("2021-03-16T00:00:00+09:00"),
        updatedAt: new Date("2021-03-18T00:00:00+09:00"),
      },
      {
        publishedAt: new Date("2025-12-01T00:00:00+09:00"),
      },
    ]);

    expect(lastBuildDate).toEqual(new Date("2025-12-01T00:00:00+09:00"));
  });

  test("includes only canonical translated detail routes in sitemap entries", () => {
    const site = new URL("https://mackysoft.net");
    const entries = buildSitemapEntries(site, {
      articleDetails: [
        {
          slug: "vision-introduction",
          lastmod: new Date("2021-03-18T00:00:00+09:00"),
          localizedLocales: ["en", "zh-hant"],
        },
        {
          slug: "debug-context",
          lastmod: new Date("2026-01-06T12:05:01+09:00"),
          localizedLocales: [],
        },
      ],
      gameDetails: [
        {
          slug: "treasure-rogue",
          lastmod: new Date("2020-05-21T00:00:00+09:00"),
          localizedLocales: ["en", "zh-hant"],
        },
      ],
      contentPages: [
        {
          slug: "privacy-policy",
          localizedLocales: ["en", "zh-hant"],
        },
      ],
      tagPaths: ["/tags/unity/"],
      archivePaths: ["/archive/2021/", "/archive/2021/03/"],
    });

    const locations = entries.map((entry) => entry.loc);

    expect(locations).toContain(toAbsoluteSiteUrl(site, "/en/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/zh-hant/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/en/articles/vision-introduction/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/zh-hant/articles/vision-introduction/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/en/games/treasure-rogue/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/zh-hant/games/treasure-rogue/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/en/tags/unity/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/zh-hant/tags/unity/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/en/archive/2021/03/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/zh-hant/archive/2021/03/"));
    expect(locations).toContain(toAbsoluteSiteUrl(site, "/articles/debug-context/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/contact/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/en/contact/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/search/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/en/search/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/privacy-policy/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/en/privacy-policy/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/zh-hant/privacy-policy/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/en/articles/debug-context/"));
    expect(locations).not.toContain(toAbsoluteSiteUrl(site, "/zh-hant/articles/debug-context/"));
  });

  test("renders robots.txt and llms.txt from the configured public site", () => {
    const site = new URL("https://preview.example.com");
    const robots = renderRobotsTxt(site);
    const llms = renderLlmsTxt(site);

    expect(robots).toContain(`Sitemap: ${toAbsoluteSiteUrl(site, "/sitemap.xml")}`);

    expect(llms).toContain(`[About](${toAbsoluteSiteUrl(site, "/about/")})`);
    expect(llms).toContain(`- Japanese: ${toAbsoluteSiteUrl(site, "/")}`);
    expect(llms).toContain(`- English: ${toAbsoluteSiteUrl(site, "/en/")}`);
    expect(llms).toContain(`- Traditional Chinese: ${toAbsoluteSiteUrl(site, "/zh-hant/")}`);
    expect(llms).toContain(`[Sitemap](${toAbsoluteSiteUrl(site, "/sitemap.xml")})`);
    expect(llms).toContain(`[RSS Feed](${toAbsoluteSiteUrl(site, "/feed.xml")})`);
    expect(llms).not.toContain("English About");
  });
});
