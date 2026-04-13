import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { formatContentDate } from "../../src/lib/content-date";

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
  articles: Array<{
    publishedAt: string;
    locales: {
      ja: { title: string; url: string };
      en?: { title: string; url: string };
    };
  }>;
};
const latestZennArticle = activityData.articles[0]!;
const latestZennArticleJa = latestZennArticle.locales.ja;
const latestZennArticleEn = latestZennArticle.locales.en ?? latestZennArticle.locales.ja;
const translatedVisionTitle = "[Unity] Implementing CullingGroup More Easily [Vision]";

test.describe("articles page", () => {
  test("shows local and Zenn articles in the same card format", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/");

    await expect(page.locator(".page-header .eyebrow")).toHaveText("Home / Articles");
    await expect(page.getByRole("heading", { level: 1, name: "記事" })).toBeVisible();
    await expect(page.locator(".page-lead__summary")).toHaveCount(0);
    await expect(page.getByRole("link", { name: latestZennArticleJa.title, exact: true })).toBeVisible();

    const zennCard = page.locator(".article-card").filter({ hasText: latestZennArticleJa.title }).first();
    await expect(zennCard).toContainText("Zenn");
    await expect(zennCard).toContainText("公開日");
    await expect(zennCard).toContainText(formatContentDate(new Date(latestZennArticle.publishedAt), "ja"));
    await expect(zennCard.locator("img")).toHaveCount(1);
    await expect(zennCard.locator(".article-card__tags")).toHaveCount(0);
    await expect(zennCard.getByRole("link", { name: latestZennArticleJa.title, exact: true })).toHaveAttribute(
      "href",
      latestZennArticleJa.url,
    );
  });

  test("shows translated external metadata and localized local articles on the English index page", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/articles/");

    await expect(page.locator(".page-header .eyebrow")).toHaveText("Home / Articles");
    await expect(page.getByRole("heading", { level: 1, name: "Articles" })).toBeVisible();
    await expect(page.locator(".page-lead__summary")).toHaveCount(0);

    const translatedZennCard = page.locator(".article-card").filter({ hasText: latestZennArticleEn.title }).first();
    await expect(translatedZennCard).toContainText("Published");
    await expect(translatedZennCard).toContainText(formatContentDate(new Date(latestZennArticle.publishedAt), "en"));
    await expect(translatedZennCard.getByRole("link", { name: latestZennArticleEn.title, exact: true })).toHaveAttribute(
      "href",
      latestZennArticleEn.url,
    );

    const localizedLocalCard = page.locator(".article-card").filter({ hasText: translatedVisionTitle }).first();
    await expect(localizedLocalCard).not.toContainText("Japanese only");
    await expect(localizedLocalCard.getByRole("link", { name: translatedVisionTitle, exact: true })).toHaveAttribute(
      "href",
      "/en/articles/vision-introduction/",
    );
  });

  test("navigates from anywhere on an article card", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/articles/");

    const localizedLocalCard = page.locator(".article-card").filter({ hasText: translatedVisionTitle }).first();

    await localizedLocalCard.click();

    await expect(page).toHaveURL("/en/articles/vision-introduction/");
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

  test("keeps fragment targets below the sticky header on small screens", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
    const page = await context.newPage();

    await page.goto(`/articles/vision-introduction/#${encodeURIComponent("visionとは")}`);

    await page.waitForFunction(() => {
      const value = document.documentElement.style.getPropertyValue("--site-header-offset");
      return value.endsWith("px");
    });

    const header = page.locator(".site-header");
    const target = page.locator("#visionとは");

    const headerBox = await header.boundingBox();
    const targetBox = await target.boundingBox();

    if (!headerBox || !targetBox) {
      throw new Error("header and fragment target must be visible before anchor assertions");
    }

    expect(targetBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);

    await context.close();
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

  test("renders translated English local article routes without fallback notice", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/articles/vision-introduction/");

    const breadcrumb = page.locator(".article-page-header .eyebrow");

    await expect(page).toHaveURL("/en/articles/vision-introduction/");
    await expect(page.locator(".article-fallback-notice")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: translatedVisionTitle })).toBeVisible();
    await expect(breadcrumb).toHaveText("Home / Articles");
    await expect(page.locator(".article-content")).toContainText("What is the CullingGroup API?");
  });

  test("keeps localized internal links inside English article content", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/articles/roguelike-map-generation-algorithm/");

    const internalGameLink = page.locator('.article-content a[href="/en/games/treasure-rogue/"]').first();

    await expect(internalGameLink).toHaveAttribute("href", "/en/games/treasure-rogue/");

    await page.goto("/en/articles/roguelike-random-enemy-select/");

    const relatedArticleLink = page.locator('.article-content a[href="/en/articles/roguelike-map-generation-algorithm/"]').first();

    await expect(relatedArticleLink).toHaveAttribute("href", "/en/articles/roguelike-map-generation-algorithm/");
  });

  test("keeps markdown body images rendered on Japanese and English article pages", { tag: "@size:medium" }, async ({ page }) => {
    for (const pathname of ["/articles/vision-introduction/", "/en/articles/vision-introduction/"]) {
      await page.goto(pathname);

      const firstBodyImage = page.locator(".article-content img").first();

      await expect(firstBodyImage).toBeVisible();

      const imageState = await firstBodyImage.evaluate((image) => {
        const htmlImage = image as HTMLImageElement;

        return {
          src: htmlImage.getAttribute("src"),
          currentSrc: htmlImage.currentSrc,
        };
      });

      expect(imageState.src || imageState.currentSrc).toBeTruthy();
      expect(imageState.currentSrc.length).toBeGreaterThan(0);
    }
  });
});
