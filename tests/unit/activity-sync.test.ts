import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import activityData from "../../src/generated/activity.json";
import {
  sortArticleItems,
  toExternalArticleItem,
} from "../../src/lib/articles";
import type { ArticleActivity } from "../../src/lib/articles";
import {
  getLatestReleaseActivities,
  getLatestReleases,
  getReleaseActivities,
} from "../../src/lib/releases";
import type { ReleaseActivity } from "../../src/lib/releases";
import {
  createReleaseCoverRelativePath,
  createVersionedLocalCoverUrl,
  resolveLocalCoverPath,
  parseZennArticlePage,
  githubApiBaseUrl,
  githubGraphqlUrl,
  githubReleasePageSize,
  parseZennFeed,
  serializeActivity,
  summarizeDescription,
  syncActivity,
  zennFeedUrl,
} from "../../scripts/sync-activity.mjs";

const zennFeedFixturePath = path.join(import.meta.dirname, "../fixtures/zenn-feed.xml");
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sX6s2sAAAAASUVORK5CYII=",
  "base64",
);

test("re-exports shared GitHub activity sync constants", () => {
  expect(githubApiBaseUrl).toBe("https://api.github.com");
  expect(githubGraphqlUrl).toBe("https://api.github.com/graphql");
  expect(githubReleasePageSize).toBe(100);
});

function createJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createTextResponse(payload: string, init: ResponseInit = {}) {
  return new Response(payload, {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

function createHtmlResponse(payload: string, init: ResponseInit = {}) {
  return new Response(payload, {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function createZennArticlePageHtml({
  locale,
  title,
  canonicalUrl,
  bodyHtml,
  ogImageUrl,
  isTranslated,
}: {
  locale: string;
  title: string;
  canonicalUrl: string;
  bodyHtml: string;
  ogImageUrl?: string;
  isTranslated: boolean;
}) {
  return `<!DOCTYPE html>
<html lang="${locale}">
  <head>
    <title>${title}</title>
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:url" content="${canonicalUrl}" />
    ${ogImageUrl ? `<meta property="og:image" content="${ogImageUrl}" />` : ""}
  </head>
  <body>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          locale,
          article: {
            title,
            bodyHtml,
            ogImageUrl,
            isTranslated,
            locale,
          },
        },
      },
    })}</script>
  </body>
</html>`;
}

async function createSuccessfulFetchMock(): Promise<(input: string | URL | Request, init?: RequestInit) => Promise<Response>> {
  const xml = await readFile(zennFeedFixturePath, "utf8");
  const alphaPageOne = [
    ...Array.from({ length: 99 }, (_, index) => ({
      name: `2.0.${index}-beta`,
      tag_name: `2.0.${index}-beta`,
      html_url: `https://github.com/mackysoft/Alpha/releases/tag/2.0.${index}-beta`,
      published_at: `2026-02-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      draft: false,
      prerelease: true,
    })),
    {
      name: "1.9.0",
      tag_name: "1.9.0",
      html_url: "https://github.com/mackysoft/Alpha/releases/tag/1.9.0",
      published_at: "2024-01-20T00:00:00.000Z",
      draft: false,
      prerelease: false,
    },
  ];

  return async (input) => {
    const url = input instanceof Request ? input.url : String(input);

    if (url === `${zennFeedUrl}`) {
      return createTextResponse(xml);
    }

    if (url.startsWith("https://opengraph.githubassets.com/mock/") || url.startsWith("https://repository-images.githubusercontent.com/mock/")) {
      return new Response(tinyPng, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
        },
      });
    }

    if (url === "https://zenn.dev/makihiro_dev/articles/first-article?locale=en") {
      return createHtmlResponse(createZennArticlePageHtml({
        locale: "en",
        title: "First article in English",
        canonicalUrl: url,
        bodyHtml: "<p>English summary for the first article.</p>",
        ogImageUrl: "https://res.cloudinary.com/zenn/image/upload/sample-cover-en.png",
        isTranslated: true,
      }));
    }

    if (url === "https://zenn.dev/makihiro_dev/articles/second-article?locale=en") {
      return createHtmlResponse(createZennArticlePageHtml({
        locale: "en",
        title: "Second article",
        canonicalUrl: url,
        bodyHtml: "<p>Japanese only article.</p>",
        isTranslated: false,
      }));
    }

    if (url === githubGraphqlUrl) {
      return createJsonResponse({
        data: {
          user: {
            repositories: {
              pageInfo: {
                hasNextPage: false,
                endCursor: null,
              },
              nodes: [
                {
                  name: "Alpha",
                  nameWithOwner: "mackysoft/Alpha",
                  description: "Alpha description",
                  licenseInfo: {
                    spdxId: "MIT",
                    name: "MIT License",
                  },
                  isArchived: false,
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/alpha",
                  stargazerCount: 137,
                },
                {
                  name: "Beta",
                  nameWithOwner: "mackysoft/Beta",
                  description: "Beta description",
                  licenseInfo: {
                    spdxId: "Apache-2.0",
                    name: "Apache License 2.0",
                  },
                  isArchived: false,
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/beta",
                  stargazerCount: 42,
                },
                {
                  name: "Gamma",
                  nameWithOwner: "mackysoft/Gamma",
                  description: null,
                  licenseInfo: null,
                  isArchived: false,
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/gamma",
                  stargazerCount: 7,
                },
                {
                  name: "DraftOnly",
                  nameWithOwner: "mackysoft/DraftOnly",
                  description: "Draft only description",
                  licenseInfo: {
                    spdxId: "MIT",
                    name: "MIT License",
                  },
                  isArchived: false,
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/draft-only",
                  stargazerCount: 1,
                },
                {
                  name: "Unity-GitHubActions-ExportPackage-Example",
                  nameWithOwner: "mackysoft/Unity-GitHubActions-ExportPackage-Example",
                  description: "Tutorial repository that should be excluded.",
                  licenseInfo: {
                    spdxId: "MIT",
                    name: "MIT License",
                  },
                  isArchived: false,
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/export-package-example",
                  stargazerCount: 12,
                },
                {
                  name: "ArchivedRepo",
                  nameWithOwner: "mackysoft/ArchivedRepo",
                  description: "Archived repository that should be excluded.",
                  licenseInfo: {
                    spdxId: "MIT",
                    name: "MIT License",
                  },
                  isArchived: true,
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/archived-repo",
                  stargazerCount: 9,
                },
              ],
            },
          },
        },
      });
    }

    const requestUrl = new URL(url);
    const releasePath = requestUrl.pathname.replace("/repos/", "").replace("/releases", "");
    const page = requestUrl.searchParams.get("page") ?? "1";

    if (requestUrl.origin === githubApiBaseUrl && requestUrl.searchParams.get("per_page") === "100") {
      switch (releasePath) {
        case "mackysoft/Alpha":
          if (page === "1") {
            return createJsonResponse(alphaPageOne);
          }

          if (page === "2") {
            return createJsonResponse([
              {
                name: "1.8.5",
                tag_name: "1.8.5",
                html_url: "https://github.com/mackysoft/Alpha/releases/tag/1.8.5",
                published_at: "2026-01-20T00:00:00.000Z",
                draft: false,
                prerelease: false,
              },
            ]);
          }

          return createJsonResponse([]);
        case "mackysoft/Beta":
          return createJsonResponse(page === "1" ? [
            {
              name: "Stable name",
              tag_name: "1.0.0",
              html_url: "https://github.com/mackysoft/Beta/releases/tag/1.0.0",
              published_at: "2024-08-15T16:19:05.000Z",
              draft: false,
              prerelease: false,
            },
          ] : []);
        case "mackysoft/Gamma":
          return createJsonResponse(page === "1" ? [
            {
              name: null,
              tag_name: "1.1.0",
              html_url: "https://github.com/mackysoft/Gamma/releases/tag/1.1.0",
              published_at: "2024-02-14T12:02:45.000Z",
              draft: false,
              prerelease: false,
            },
          ] : []);
        case "mackysoft/DraftOnly":
          return createJsonResponse(page === "1" ? [
            {
              name: "2.0.0",
              tag_name: "2.0.0",
              html_url: "https://github.com/mackysoft/DraftOnly/releases/tag/2.0.0",
              published_at: "2025-01-01T00:00:00.000Z",
              draft: true,
              prerelease: false,
            },
          ] : []);
        case "mackysoft/Unity-GitHubActions-ExportPackage-Example":
          return createJsonResponse(page === "1" ? [
            {
              name: "1.0.0",
              tag_name: "1.0.0",
              html_url: "https://github.com/mackysoft/Unity-GitHubActions-ExportPackage-Example/releases/tag/1.0.0",
              published_at: "2024-01-01T00:00:00.000Z",
              draft: false,
              prerelease: false,
            },
          ] : []);
        case "mackysoft/ArchivedRepo":
          return createJsonResponse(page === "1" ? [
            {
              name: "1.0.0",
              tag_name: "1.0.0",
              html_url: "https://github.com/mackysoft/ArchivedRepo/releases/tag/1.0.0",
              published_at: "2024-06-01T00:00:00.000Z",
              draft: false,
              prerelease: false,
            },
          ] : []);
        default:
          break;
      }
    }

    return createTextResponse("Not Found", {
      status: 404,
      statusText: "Not Found",
    });
  };
}

describe("sync-activity", () => {
  test("normalizes Zenn RSS into the activity.json articles contract", async () => {
    const xml = await readFile(zennFeedFixturePath, "utf8");

    expect(parseZennFeed(xml)).toEqual([
      {
        id: "zenn:first-article",
        source: "Zenn",
        publishedAt: "2026-01-06T03:05:01.000Z",
        locales: {
          ja: {
            title: "First article",
            description: "Summary with line breaks.",
            url: "https://zenn.dev/makihiro_dev/articles/first-article",
            coverUrl: "https://res.cloudinary.com/zenn/image/upload/sample-cover.png",
            coverAlt: "First article のカバー画像",
          },
        },
      },
      {
        id: "zenn:second-article",
        source: "Zenn",
        publishedAt: "2024-09-24T03:00:05.000Z",
        locales: {
          ja: {
            title: "Second article",
            description: "HTML entity & spaces",
            url: "https://zenn.dev/makihiro_dev/articles/second-article",
          },
        },
      },
    ]);
  });

  test("extracts localized Zenn article data from the detail page", () => {
    const html = createZennArticlePageHtml({
      locale: "en",
      title: "Localized title",
      canonicalUrl: "https://zenn.dev/makihiro_dev/articles/localized?locale=en",
      bodyHtml: "<p>Localized summary text.</p>",
      ogImageUrl: "https://example.com/cover.png",
      isTranslated: true,
    });

    expect(parseZennArticlePage(html)).toEqual({
      title: "Localized title",
      description: "Localized summary text.",
      content: "Localized summary text.",
      url: "https://zenn.dev/makihiro_dev/articles/localized?locale=en",
      locale: "en",
      isTranslated: true,
      coverUrl: "https://example.com/cover.png",
      coverAlt: "Localized title cover image",
    });
  });

  test("converts external articles into ArticleItem entries with covers and descending dates", () => {
    const articleItems = sortArticleItems(
      (activityData as unknown as { articles: ArticleActivity[] }).articles.map((article) => toExternalArticleItem(article)),
    );

    expect(articleItems.length).toBeGreaterThan(0);
    expect(articleItems[0]?.source).toBe("Zenn");
    expect(articleItems[0]?.cover?.kind).toBe("remote");
    expect(articleItems.every((article) => article.source === "Zenn")).toBe(true);
    expect(articleItems.every((article) => article.tags.length === 0)).toBe(true);

    for (let index = 1; index < articleItems.length; index += 1) {
      expect(articleItems[index - 1]!.publishedAt.valueOf()).toBeGreaterThanOrEqual(articleItems[index]!.publishedAt.valueOf());
    }
  });

  test("falls back to Japanese external metadata when the requested locale is unavailable", () => {
    const articleItem = toExternalArticleItem({
      id: "zenn:fallback",
      source: "Zenn",
      publishedAt: "2024-01-01T00:00:00.000Z",
      locales: {
        ja: {
          title: "日本語タイトル",
          description: "日本語の概要",
          url: "https://zenn.dev/makihiro_dev/articles/fallback",
        },
      },
    }, "en");

    expect(articleItem.title).toBe("日本語タイトル");
    expect(articleItem.description).toBe("日本語の概要");
    expect(articleItem.href).toBe("https://zenn.dev/makihiro_dev/articles/fallback");
    expect(articleItem.contentLocale).toBe("ja");
    expect(articleItem.isFallback).toBe(true);
  });

  test("formats summary text for article cards", () => {
    expect(summarizeDescription("  Alpha   Beta \n Gamma  ", 20)).toBe("Alpha Beta Gamma");
    expect(summarizeDescription("12345678901234567890", 10)).toBe("123456789…");
  });

  test("normalizes GitHub releases into the activity.json release contract", async () => {
    const fetchImpl = await createSuccessfulFetchMock();
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");
    const coverOutputDir = path.join(tempDir, "activity-covers");
    const expectedVersionedCoverUrl = createVersionedLocalCoverUrl(
      createReleaseCoverRelativePath("mackysoft/Alpha", ".png"),
      tinyPng,
    );

    const activity = await syncActivity({
      fetchImpl,
      outputPath,
      coverOutputDir,
    });

    expect(activity.releases).toEqual([
      {
        groupId: "GitHub:mackysoft/Alpha",
        source: "GitHub",
        repo: "mackysoft/Alpha",
        description: "Alpha description",
        license: "MIT",
        stargazerCount: 137,
        name: "1.8.5",
        version: "1.8.5",
        url: "https://github.com/mackysoft/Alpha/releases/tag/1.8.5",
        publishedAt: "2026-01-20T00:00:00.000Z",
        coverUrl: expectedVersionedCoverUrl,
        coverAlt: "mackysoft/Alpha のリポジトリサムネイル",
      },
      {
        groupId: "GitHub:mackysoft/Beta",
        source: "GitHub",
        repo: "mackysoft/Beta",
        description: "Beta description",
        license: "Apache-2.0",
        stargazerCount: 42,
        name: "Stable name",
        version: "1.0.0",
        url: "https://github.com/mackysoft/Beta/releases/tag/1.0.0",
        publishedAt: "2024-08-15T16:19:05.000Z",
        coverUrl: createVersionedLocalCoverUrl(createReleaseCoverRelativePath("mackysoft/Beta", ".png"), tinyPng),
        coverAlt: "mackysoft/Beta のリポジトリサムネイル",
      },
      {
        groupId: "GitHub:mackysoft/Gamma",
        source: "GitHub",
        repo: "mackysoft/Gamma",
        description: "",
        license: "",
        stargazerCount: 7,
        name: "1.1.0",
        version: "1.1.0",
        url: "https://github.com/mackysoft/Gamma/releases/tag/1.1.0",
        publishedAt: "2024-02-14T12:02:45.000Z",
        coverUrl: createVersionedLocalCoverUrl(createReleaseCoverRelativePath("mackysoft/Gamma", ".png"), tinyPng),
        coverAlt: "mackysoft/Gamma のリポジトリサムネイル",
      },
    ]);
    expect(activity.releases.some((release) => release.repo === "mackysoft/Unity-GitHubActions-ExportPackage-Example")).toBe(false);
    expect(activity.releases.some((release) => release.repo === "mackysoft/ArchivedRepo")).toBe(false);

    await expect(readFile(resolveLocalCoverPath(coverOutputDir, createReleaseCoverRelativePath("mackysoft/Alpha", ".png")))).resolves.toEqual(tinyPng);
    await expect(readFile(outputPath, "utf8")).resolves.toContain(`"coverUrl": "${expectedVersionedCoverUrl}"`);
    await rm(tempDir, { recursive: true, force: true });
  });

  test("retries cover downloads and keeps the previous cached cover when the latest fetch still fails", async () => {
    const xml = await readFile(zennFeedFixturePath, "utf8");
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");
    const coverOutputDir = path.join(tempDir, "activity-covers");
    const existingRelativePath = createReleaseCoverRelativePath("mackysoft/Alpha", ".png");
    const existingContent = Buffer.from("previous-cover");
    const existingCoverUrl = createVersionedLocalCoverUrl(existingRelativePath, existingContent);
    const existing = serializeActivity({
      articles: [],
      releases: [
        {
          groupId: "GitHub:mackysoft/Alpha",
          source: "GitHub",
          repo: "mackysoft/Alpha",
          description: "Existing release",
          license: "MIT",
          stargazerCount: 10,
          name: "1.0.0",
          version: "1.0.0",
          url: "https://github.com/mackysoft/Alpha/releases/tag/1.0.0",
          publishedAt: "2024-01-01T00:00:00.000Z",
          coverUrl: existingCoverUrl,
          coverAlt: "mackysoft/Alpha のリポジトリサムネイル",
        },
      ],
    });
    let alphaCoverFetchCount = 0;
    const successfulFetch = await createSuccessfulFetchMock();

    await writeFile(outputPath, existing, "utf8");
    await mkdir(path.dirname(resolveLocalCoverPath(coverOutputDir, existingRelativePath)), { recursive: true });
    await writeFile(resolveLocalCoverPath(coverOutputDir, existingRelativePath), existingContent);

    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);

      if (url === zennFeedUrl) {
        return createTextResponse(xml);
      }

      if (url === "https://opengraph.githubassets.com/mock/alpha") {
        alphaCoverFetchCount += 1;
        return createJsonResponse(
          { message: "Service Unavailable" },
          {
            status: 503,
            statusText: "Service Unavailable",
          },
        );
      }

      return successfulFetch(input, init);
    };

    const activity = await syncActivity({
      fetchImpl,
      outputPath,
      coverOutputDir,
    });

    expect(alphaCoverFetchCount).toBe(3);
    expect(activity.releases.find((release) => release.repo === "mackysoft/Alpha")?.coverUrl).toBe(existingCoverUrl);
    await expect(readFile(resolveLocalCoverPath(coverOutputDir, existingRelativePath))).resolves.toEqual(existingContent);
    await rm(tempDir, { recursive: true, force: true });
  });

  test("fails sync when the fetched cover cannot be written locally", async () => {
    const fetchImpl = await createSuccessfulFetchMock();
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");
    const coverOutputDir = path.join(tempDir, "activity-covers");
    const blockingPath = path.join(coverOutputDir, "github");

    await mkdir(coverOutputDir, { recursive: true });
    await writeFile(blockingPath, "not-a-directory", "utf8");

    await expect(syncActivity({
      fetchImpl,
      outputPath,
      coverOutputDir,
    })).rejects.toThrow();

    await rm(tempDir, { recursive: true, force: true });
  });

  test("fails sync when a release cover download fails without a previous cached cover", async () => {
    const successfulFetch = await createSuccessfulFetchMock();
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");
    const coverOutputDir = path.join(tempDir, "activity-covers");
    const fetchImpl = async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url === "https://opengraph.githubassets.com/mock/alpha") {
        return createJsonResponse(
          { message: "Service Unavailable" },
          {
            status: 503,
            statusText: "Service Unavailable",
          },
        );
      }

      return successfulFetch(input, init);
    };

    await expect(syncActivity({
      fetchImpl,
      outputPath,
      coverOutputDir,
    })).rejects.toThrow("Failed to localize release cover for mackysoft/Alpha");

    await rm(tempDir, { recursive: true, force: true });
  });

  test("adds English article metadata when translation is available and keeps Japanese-only articles as fallback", async () => {
    const fetchImpl = await createSuccessfulFetchMock();
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");
    const coverOutputDir = path.join(tempDir, "activity-covers");

    const activity = await syncActivity({
      fetchImpl,
      outputPath,
      coverOutputDir,
    });

    expect(activity.articles).toEqual([
      {
        id: "zenn:first-article",
        source: "Zenn",
        publishedAt: "2026-01-06T03:05:01.000Z",
        locales: {
          ja: {
            title: "First article",
            description: "Summary with line breaks.",
            url: "https://zenn.dev/makihiro_dev/articles/first-article",
            coverUrl: "https://res.cloudinary.com/zenn/image/upload/sample-cover.png",
            coverAlt: "First article のカバー画像",
          },
          en: {
            title: "First article in English",
            description: "English summary for the first article.",
            url: "https://zenn.dev/makihiro_dev/articles/first-article?locale=en",
            coverUrl: "https://res.cloudinary.com/zenn/image/upload/sample-cover-en.png",
            coverAlt: "First article in English cover image",
          },
        },
      },
      {
        id: "zenn:second-article",
        source: "Zenn",
        publishedAt: "2024-09-24T03:00:05.000Z",
        locales: {
          ja: {
            title: "Second article",
            description: "HTML entity & spaces",
            url: "https://zenn.dev/makihiro_dev/articles/second-article",
          },
        },
      },
    ]);

    await rm(tempDir, { recursive: true, force: true });
  });

  test("keeps only the newest three releases in descending order for top page helpers", () => {
    const latestReleases = getLatestReleaseActivities([
      {
        groupId: "GitHub:mackysoft/old",
        source: "GitHub",
        repo: "mackysoft/old",
        description: "old",
        license: "MIT",
        stargazerCount: 10,
        name: "1.0.0",
        version: "1.0.0",
        url: "https://example.com/old",
        publishedAt: "2024-01-01T00:00:00.000Z",
        coverUrl: "https://example.com/old.png",
        coverAlt: "old",
      },
      {
        groupId: "GitHub:mackysoft/newest",
        source: "GitHub",
        repo: "mackysoft/newest",
        description: "newest",
        license: "Apache-2.0",
        stargazerCount: 40,
        name: "4.0.0",
        version: "4.0.0",
        url: "https://example.com/newest",
        publishedAt: "2026-01-01T00:00:00.000Z",
        coverUrl: "https://example.com/newest.png",
        coverAlt: "newest",
      },
      {
        groupId: "GitHub:mackysoft/middle",
        source: "GitHub",
        repo: "mackysoft/middle",
        description: "middle",
        license: "MIT",
        stargazerCount: 30,
        name: "3.0.0",
        version: "3.0.0",
        url: "https://example.com/middle",
        publishedAt: "2025-01-01T00:00:00.000Z",
        coverUrl: "https://example.com/middle.png",
        coverAlt: "middle",
      },
      {
        groupId: "GitHub:mackysoft/third",
        source: "GitHub",
        repo: "mackysoft/third",
        description: "third",
        license: "MIT",
        stargazerCount: 20,
        name: "2.0.0",
        version: "2.0.0",
        url: "https://example.com/third",
        publishedAt: "2024-06-01T00:00:00.000Z",
        coverUrl: "https://example.com/third.png",
        coverAlt: "third",
      },
    ] satisfies ReleaseActivity[]);

    expect(latestReleases.map((release) => release.repo)).toEqual([
      "mackysoft/newest",
      "mackysoft/middle",
      "mackysoft/third",
    ]);
  });

  test("returns all checked-in releases in descending order", () => {
    const releases = getReleaseActivities();
    const expected = [...activityData.releases].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

    expect(releases).toEqual(expected);
  });

  test("returns the newest checked-in releases in descending order", () => {
    expect(activityData.releases.length).toBeGreaterThanOrEqual(3);

    const latestReleases = getLatestReleases();
    const expected = getReleaseActivities().slice(0, 3);

    expect(latestReleases).toEqual(expected);
  });

  test("does not overwrite an existing activity.json when GitHub sync fails", async () => {
    const xml = await readFile(zennFeedFixturePath, "utf8");
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");
    const existing = serializeActivity({
      articles: [
        {
          id: "zenn:existing",
          source: "Zenn",
          publishedAt: "2024-01-01T00:00:00.000Z",
          locales: {
            ja: {
              title: "Existing article",
              description: "Existing data",
              url: "https://zenn.dev/makihiro_dev/articles/existing",
            },
          },
        },
      ],
      releases: [
        {
          groupId: "GitHub:mackysoft/existing",
          source: "GitHub",
          repo: "mackysoft/existing",
          description: "Existing release",
          license: "MIT",
          stargazerCount: 99,
          name: "1.0.0",
          version: "1.0.0",
          url: "https://github.com/mackysoft/existing/releases/tag/1.0.0",
          publishedAt: "2024-01-01T00:00:00.000Z",
          coverUrl: "https://opengraph.githubassets.com/mock/existing",
          coverAlt: "existing",
        },
      ],
    });

    await writeFile(outputPath, existing, "utf8");

    await expect(
      syncActivity({
        outputPath,
        fetchImpl: async (input) => {
          const url = input instanceof Request ? input.url : String(input);

          if (url === zennFeedUrl) {
            return createTextResponse(xml);
          }

          return createJsonResponse(
            { message: "Service Unavailable" },
            {
              status: 503,
              statusText: "Service Unavailable",
            },
          );
        },
      }),
    ).rejects.toThrow(`Failed to fetch ${githubGraphqlUrl}: 503 Service Unavailable`);

    await expect(readFile(outputPath, "utf8")).resolves.toBe(existing);

    await rm(tempDir, { recursive: true, force: true });
  });
});
