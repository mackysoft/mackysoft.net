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
  test("serves robots.txt with a sitemap reference", { tag: "@size:medium" }, async ({ request }) => {
    const response = await request.get("/robots.txt");
    const body = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("text/plain");
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Content-Signal: ai-train=yes, search=yes, ai-input=yes");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap: https://mackysoft.net/sitemap.xml");
  });

  test("serves llms.txt with curated canonical site links", { tag: "@size:medium" }, async ({ request }) => {
    const response = await request.get("/llms.txt");
    const body = await response.text();

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("text/plain");
    expect(body).toContain("# mackysoft.net");
    expect(body).toContain("Canonical site for Hiroya Aramaki / Makihiro");
    expect(body).toContain("[About](https://mackysoft.net/about/)");
    expect(body).toContain("## Supported Languages");
    expect(body).toContain("- Japanese: https://mackysoft.net/");
    expect(body).toContain("- English: https://mackysoft.net/en/");
    expect(body).toContain("[RSS Feed](https://mackysoft.net/feed.xml)");
    expect(body).not.toContain("English About");
  });

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
    expect(body).toContain("https://mackysoft.net/games/treasure-rogue/");
    expect(body).not.toContain("https://mackysoft.net/contact/");
    expect(body).not.toContain("https://mackysoft.net/en/contact/");
    expect(body).not.toContain("https://mackysoft.net/search/");
    expect(body).not.toContain("https://mackysoft.net/en/search/");
    expect(body).not.toContain("https://mackysoft.net/privacy-policy/");
    expect(body).not.toContain("https://mackysoft.net/en/privacy-policy/");
    expect(body).not.toContain("https://mackysoft.net/en/articles/debug-context/");
  });

  test("serves generated article OGP PNG endpoints", { tag: "@size:medium" }, async ({ request }) => {
    const response = await request.get("/og/articles/turnbased-gameloop.png");
    const localizedResponse = await request.get("/en/og/articles/turnbased-gameloop.png");
    const cardResponse = await request.get("/og/articles/cards/turnbased-gameloop.png");
    const localizedCardResponse = await request.get("/en/og/articles/cards/turnbased-gameloop.png");

    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/png");
    expect((await response.body()).byteLength).toBeGreaterThan(0);

    expect(localizedResponse.ok()).toBeTruthy();
    expect(localizedResponse.headers()["content-type"]).toContain("image/png");
    expect((await localizedResponse.body()).byteLength).toBeGreaterThan(0);

    expect(cardResponse.ok()).toBeTruthy();
    expect(cardResponse.headers()["content-type"]).toContain("image/png");
    expect((await cardResponse.body()).byteLength).toBeGreaterThan(0);

    expect(localizedCardResponse.ok()).toBeTruthy();
    expect(localizedCardResponse.headers()["content-type"]).toContain("image/png");
    expect((await localizedCardResponse.body()).byteLength).toBeGreaterThan(0);
  });
});
