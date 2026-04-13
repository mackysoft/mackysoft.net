import { describe, expect, test } from "vitest";

import { getFeedLastBuildDate, selectPublicLocalArticles, toRssFeedItems } from "../../src/lib/publishing/feed";
import { buildSitemapEntries } from "../../src/lib/publishing/sitemap";

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

  test("includes only canonical english detail routes in sitemap entries", () => {
    const entries = buildSitemapEntries(new URL("https://mackysoft.net"), {
      articleDetails: [
        {
          slug: "vision-introduction",
          lastmod: new Date("2021-03-18T00:00:00+09:00"),
          hasEnglishVersion: true,
        },
        {
          slug: "debug-context",
          lastmod: new Date("2026-01-06T12:05:01+09:00"),
          hasEnglishVersion: false,
        },
      ],
      gameDetails: [
        {
          slug: "treasure-rogue",
          lastmod: new Date("2020-05-21T00:00:00+09:00"),
          hasEnglishVersion: true,
        },
      ],
      contentPages: [
        {
          slug: "privacy-policy",
          hasEnglishVersion: true,
        },
      ],
      tagPaths: ["/tags/unity/"],
      archivePaths: ["/archive/2021/", "/archive/2021/03/"],
    });

    const locations = entries.map((entry) => entry.loc);

    expect(locations).toContain("https://mackysoft.net/en/");
    expect(locations).toContain("https://mackysoft.net/en/articles/vision-introduction/");
    expect(locations).toContain("https://mackysoft.net/en/games/treasure-rogue/");
    expect(locations).toContain("https://mackysoft.net/en/privacy-policy/");
    expect(locations).toContain("https://mackysoft.net/en/tags/unity/");
    expect(locations).toContain("https://mackysoft.net/en/archive/2021/03/");
    expect(locations).toContain("https://mackysoft.net/articles/debug-context/");
    expect(locations).not.toContain("https://mackysoft.net/en/articles/debug-context/");
  });
});
