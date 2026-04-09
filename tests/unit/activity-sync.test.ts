import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, test } from "vitest";

import activityData from "../../src/generated/activity.json";
import { sortArticleItems, toExternalArticleItem } from "../../src/lib/article-items";
import { parseZennFeed, serializeActivity, summarizeDescription, syncActivity } from "../../scripts/sync-activity.mjs";

const zennFeedFixturePath = path.join(import.meta.dirname, "../fixtures/zenn-feed.xml");

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

  test("does not overwrite an existing activity.json when sync fails", async () => {
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
      releases: [],
    });

    await writeFile(outputPath, existing, "utf8");

    await expect(
      syncActivity({
        outputPath,
        fetchImpl: async () =>
          ({
            ok: false,
            status: 503,
            statusText: "Service Unavailable",
          }) as Response,
      }),
    ).rejects.toThrow("Failed to fetch Zenn feed: 503 Service Unavailable");

    await expect(readFile(outputPath, "utf8")).resolves.toBe(existing);

    await rm(tempDir, { recursive: true, force: true });
  });
});
