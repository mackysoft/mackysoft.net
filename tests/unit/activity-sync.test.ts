import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import activityData from "../../src/generated/activity.json";
import { getLatestReleaseActivities, sortArticleItems, toExternalArticleItem } from "../../src/lib/article-items";
import type { ReleaseActivity } from "../../src/lib/articles";
import {
  githubApiBaseUrl,
  githubGraphqlUrl,
  parseZennFeed,
  serializeActivity,
  summarizeDescription,
  syncActivity,
  zennFeedUrl,
} from "../../scripts/sync-activity.mjs";

const zennFeedFixturePath = path.join(import.meta.dirname, "../fixtures/zenn-feed.xml");

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

    if (url === zennFeedUrl) {
      return createTextResponse(xml);
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
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/alpha",
                  stargazerCount: 137,
                },
                {
                  name: "Beta",
                  nameWithOwner: "mackysoft/Beta",
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/beta",
                  stargazerCount: 42,
                },
                {
                  name: "Gamma",
                  nameWithOwner: "mackysoft/Gamma",
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/gamma",
                  stargazerCount: 7,
                },
                {
                  name: "DraftOnly",
                  nameWithOwner: "mackysoft/DraftOnly",
                  openGraphImageUrl: "https://opengraph.githubassets.com/mock/draft-only",
                  stargazerCount: 1,
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
        title: "First article",
        description: "Summary with line breaks.",
        url: "https://zenn.dev/makihiro_dev/articles/first-article",
        publishedAt: "2026-01-06T03:05:01.000Z",
        coverUrl: "https://res.cloudinary.com/zenn/image/upload/sample-cover.png",
        coverAlt: "First article のカバー画像",
      },
      {
        id: "zenn:second-article",
        source: "Zenn",
        title: "Second article",
        description: "HTML entity & spaces",
        url: "https://zenn.dev/makihiro_dev/articles/second-article",
        publishedAt: "2024-09-24T03:00:05.000Z",
      },
    ]);
  });

  test("converts external articles into ArticleItem entries with covers and descending dates", () => {
    const articleItems = sortArticleItems(activityData.articles.map(toExternalArticleItem));

    expect(articleItems.length).toBeGreaterThan(0);
    expect(articleItems[0]?.source).toBe("Zenn");
    expect(typeof articleItems[0]?.cover).toBe("string");
    expect(articleItems.every((article) => article.source === "Zenn")).toBe(true);
    expect(articleItems.every((article) => article.tags.length === 0)).toBe(true);

    for (let index = 1; index < articleItems.length; index += 1) {
      expect(articleItems[index - 1]!.publishedAt.valueOf()).toBeGreaterThanOrEqual(articleItems[index]!.publishedAt.valueOf());
    }
  });

  test("formats summary text for article cards", () => {
    expect(summarizeDescription("  Alpha   Beta \n Gamma  ", 20)).toBe("Alpha Beta Gamma");
    expect(summarizeDescription("12345678901234567890", 10)).toBe("123456789…");
  });

  test("normalizes GitHub releases into the activity.json release contract", async () => {
    const fetchImpl = await createSuccessfulFetchMock();
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");

    const activity = await syncActivity({
      fetchImpl,
      outputPath,
    });

    expect(activity.releases).toEqual([
      {
        groupId: "GitHub:mackysoft/Alpha",
        source: "GitHub",
        repo: "mackysoft/Alpha",
        stargazerCount: 137,
        name: "1.8.5",
        version: "1.8.5",
        url: "https://github.com/mackysoft/Alpha/releases/tag/1.8.5",
        publishedAt: "2026-01-20T00:00:00.000Z",
        coverUrl: "https://opengraph.githubassets.com/mock/alpha",
        coverAlt: "mackysoft/Alpha のリポジトリサムネイル",
      },
      {
        groupId: "GitHub:mackysoft/Beta",
        source: "GitHub",
        repo: "mackysoft/Beta",
        stargazerCount: 42,
        name: "Stable name",
        version: "1.0.0",
        url: "https://github.com/mackysoft/Beta/releases/tag/1.0.0",
        publishedAt: "2024-08-15T16:19:05.000Z",
        coverUrl: "https://opengraph.githubassets.com/mock/beta",
        coverAlt: "mackysoft/Beta のリポジトリサムネイル",
      },
      {
        groupId: "GitHub:mackysoft/Gamma",
        source: "GitHub",
        repo: "mackysoft/Gamma",
        stargazerCount: 7,
        name: "1.1.0",
        version: "1.1.0",
        url: "https://github.com/mackysoft/Gamma/releases/tag/1.1.0",
        publishedAt: "2024-02-14T12:02:45.000Z",
        coverUrl: "https://opengraph.githubassets.com/mock/gamma",
        coverAlt: "mackysoft/Gamma のリポジトリサムネイル",
      },
    ]);

    await expect(readFile(outputPath, "utf8")).resolves.toContain("\"coverUrl\": \"https://opengraph.githubassets.com/mock/alpha\"");
    await rm(tempDir, { recursive: true, force: true });
  });

  test("keeps only the newest three releases in descending order for top page helpers", () => {
    const latestReleases = getLatestReleaseActivities([
      {
        groupId: "GitHub:mackysoft/old",
        source: "GitHub",
        repo: "mackysoft/old",
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

  test("does not overwrite an existing activity.json when GitHub sync fails", async () => {
    const xml = await readFile(zennFeedFixturePath, "utf8");
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-activity-"));
    const outputPath = path.join(tempDir, "activity.json");
    const existing = serializeActivity({
      articles: [
        {
          id: "zenn:existing",
          source: "Zenn",
          title: "Existing article",
          description: "Existing data",
          url: "https://zenn.dev/makihiro_dev/articles/existing",
          publishedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
      releases: [
        {
          groupId: "GitHub:mackysoft/existing",
          source: "GitHub",
          repo: "mackysoft/existing",
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
