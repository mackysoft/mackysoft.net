import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

type SharePayload = {
  title: string;
  url: string;
};

type ShareWindow = Window &
  typeof globalThis & {
    __shareCalls: SharePayload[];
    __copiedTexts: string[];
  };

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  articles: Array<{ title: string; url: string }>;
};
const latestZennArticle = activityData.articles[0]!;

test.describe("articles page", () => {
  test("shows local and Zenn articles in the same card format", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/");

    await expect(page.getByText("Home / Articles", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Articles" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestZennArticle.title, exact: true })).toBeVisible();

    const zennCard = page.locator(".article-card").filter({ hasText: latestZennArticle.title }).first();
    await expect(zennCard).toContainText("Zenn");
    await expect(zennCard.locator("img")).toHaveCount(1);
    await expect(zennCard.locator(".article-card__tags")).toHaveCount(0);
    await expect(zennCard.getByRole("link", { name: latestZennArticle.title, exact: true })).toHaveAttribute(
      "href",
      latestZennArticle.url,
    );
  });

  test("keeps the article hero layout while separating the breadcrumb", { tag: "@size:medium" }, async ({ page }) => {
    await page.addInitScript(() => {
      const navigatorProxy = new Proxy(window.navigator, {
        get(target, property, receiver) {
          if (property === "share") {
            return undefined;
          }

          return Reflect.get(target, property, receiver);
        },
      });

      Object.defineProperty(window, "navigator", {
        configurable: true,
        value: navigatorProxy,
      });
    });

    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/articles/vision-introduction/");

    const main = page.getByRole("main");
    const pageHeader = main.locator(".article-page-header");
    const hero = main.locator(".article-hero");
    const toc = main.locator(".article-toc");
    const breadcrumb = pageHeader.getByText("Home / Articles", { exact: true });
    const cover = hero.locator(".cover");
    const title = hero.locator("h1");
    const meta = hero.locator(".meta");
    const prose = main.locator(".article-content");
    const bodyTags = prose.locator(".article-content__tags");
    const shareSection = prose.locator("[data-article-share]");
    const copyLinkButton = shareSection.locator("[data-share-copy]");
    const nativeShareButton = shareSection.locator("[data-share-native]");
    const twitterButton = shareSection.locator("[data-share-twitter]");

    await expect(breadcrumb).toBeVisible();
    await expect(hero.getByText("Home / Articles", { exact: true })).toHaveCount(0);
    await expect(cover.locator("img")).toBeVisible();
    await expect(title).toBeVisible();
    await expect(meta.locator("span")).toHaveCount(2);
    await expect(meta).toHaveCSS("justify-content", "center");
    await expect(hero.locator(".tags")).toHaveCount(0);
    await expect(bodyTags).toBeVisible();
    expect(await bodyTags.getByRole("link").count()).toBeGreaterThan(0);
    await expect(shareSection.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(copyLinkButton).toBeVisible();
    await expect(twitterButton).toBeVisible();
    await expect(nativeShareButton).toHaveAttribute("hidden", "");
    await expect(toc).toBeVisible();
    await expect(toc.getByRole("heading", { level: 2 })).toBeVisible();
    expect(await toc.getByRole("link").count()).toBeGreaterThan(0);
    await expect(toc).toHaveCSS("position", "sticky");
    await expect(twitterButton).toHaveAttribute("href", /twitter\.com\/intent\/tweet/);

    const articleTitle = (await title.textContent()) ?? "";
    const twitterHref = await twitterButton.getAttribute("href");
    expect(twitterHref).toContain(encodeURIComponent(articleTitle));
    expect(twitterHref).toContain(encodeURIComponent("http://127.0.0.1:4322/articles/vision-introduction/"));

    const breadcrumbBox = await breadcrumb.boundingBox();
    const coverBox = await cover.boundingBox();
    const titleBox = await title.boundingBox();
    const metaBox = await meta.boundingBox();
    const tagsBox = await bodyTags.boundingBox();
    const shareBox = await shareSection.boundingBox();
    const tocBox = await toc.boundingBox();
    const proseBox = await prose.boundingBox();

    if (!breadcrumbBox || !coverBox || !titleBox || !metaBox || !tagsBox || !shareBox || !tocBox || !proseBox) {
      throw new Error("article hero elements must be visible before order assertions");
    }

    expect(breadcrumbBox.y).toBeLessThan(coverBox.y);
    expect(coverBox.y).toBeLessThan(titleBox.y);
    expect(titleBox.y).toBeLessThan(metaBox.y);
    expect(coverBox.y).toBeLessThan(proseBox.y);
    expect(tagsBox.y).toBeGreaterThanOrEqual(proseBox.y);
    expect(shareBox.y).toBeGreaterThan(tagsBox.y);
    expect(tocBox.x).toBeGreaterThan(proseBox.x);
  });

  test("shows share actions for supported environments on article detail pages", { tag: "@size:medium" }, async ({ page }) => {
    await page.addInitScript(() => {
      const shareCalls: Array<{ title: string; url: string }> = [];
      const copiedTexts: string[] = [];

      Object.defineProperty(window, "__shareCalls", {
        configurable: true,
        value: shareCalls,
      });

      Object.defineProperty(window, "__copiedTexts", {
        configurable: true,
        value: copiedTexts,
      });

      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: { title?: string; url?: string }) => {
          shareCalls.push({
            title: data.title ?? "",
            url: data.url ?? "",
          });
        },
      });

      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            copiedTexts.push(text);
          },
        },
      });
    });

    await page.goto("/articles/vision-introduction/");

    const shareSection = page.locator("[data-article-share]");
    const nativeShareButton = shareSection.locator("[data-share-native]");
    const copyLinkButton = shareSection.locator("[data-share-copy]");
    const bubble = shareSection.locator("[data-share-status]");
    const shareTitle = await shareSection.getAttribute("data-share-title");

    await expect(nativeShareButton).toBeVisible();

    await nativeShareButton.click();

    const shareCall = await page.evaluate(() => (window as ShareWindow).__shareCalls[0]);
    expect(shareCall).toEqual({
      title: shareTitle ?? "",
      url: "http://127.0.0.1:4322/articles/vision-introduction/",
    });

    await copyLinkButton.click();

    const copiedText = await page.evaluate(() => (window as ShareWindow).__copiedTexts[0]);
    expect(copiedText).toBe("http://127.0.0.1:4322/articles/vision-introduction/");
    await expect(bubble).not.toHaveAttribute("hidden", "");
    expect((await bubble.textContent())?.trim().length).toBeGreaterThan(0);
  });

  test("keeps share fallback usable without JavaScript", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto("http://127.0.0.1:4322/articles/vision-introduction/");

    const shareSection = page.locator("[data-article-share]");
    const copyAction = shareSection.locator("[data-share-copy-action]");
    const nativeShareButton = shareSection.locator("[data-share-native]");
    const twitterButton = shareSection.locator("[data-share-twitter]");

    await expect(copyAction).toHaveAttribute("hidden", "");
    await expect(nativeShareButton).toHaveAttribute("hidden", "");
    await expect(twitterButton).toHaveAttribute("href", /twitter\.com\/intent\/tweet/);

    const twitterHref = await twitterButton.getAttribute("href");
    expect(twitterHref).toContain(encodeURIComponent("https://mackysoft.net/articles/vision-introduction/"));

    await context.close();
  });
});
