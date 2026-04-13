import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  articles: Array<{
    locales: {
      ja: { url: string };
    };
  }>;
};

const latestExternalArticleUrl = activityData.articles[0]!.locales.ja.url;

test.describe("publishing endpoints", () => {
  test("serves feed.xml with only public local articles", { tag: "@size:medium" }, async ({ request }) => {
    const response = await request.get("/feed.xml");
    const body = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("xml");
    expect(body).toContain("<rss");
    expect(body).toContain("<language>ja</language>");
    expect(body).toContain("https://mackysoft.net/articles/vision-introduction/");
    expect(body).not.toContain(latestExternalArticleUrl);
    expect(body).not.toContain("https://mackysoft.net/articles/ray/");
  });

  test("serves sitemap.xml with canonical public URLs only", { tag: "@size:medium" }, async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    const body = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("xml");
    expect(body).toContain("<urlset");
    expect(body).toContain("https://mackysoft.net/");
    expect(body).toContain("https://mackysoft.net/en/");
    expect(body).toContain("https://mackysoft.net/en/articles/vision-introduction/");
    expect(body).toContain("https://mackysoft.net/en/privacy-policy/");
    expect(body).toContain("https://mackysoft.net/games/treasure-rogue/");
    expect(body).not.toContain("https://mackysoft.net/en/articles/debug-context/");
  });
});
