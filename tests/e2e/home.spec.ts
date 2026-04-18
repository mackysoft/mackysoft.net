import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { formatContentDate } from "../../src/lib/content-date";
import { getHomePageContent } from "../../src/features/home/content";
import { getProfileContent } from "../../src/features/profile/content";

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  articles: Array<{
    publishedAt: string;
    locales: {
      ja: { title: string };
      en?: { title: string };
    };
  }>;
  releases: Array<{
    repo: string;
    version: string;
    description: string;
    license: string;
    url: string;
    publishedAt: string;
    coverUrl: string;
    coverAlt: string;
  }>;
};
const latestZennArticle = activityData.articles[0]!;
const latestZennArticleJa = latestZennArticle.locales.ja;
const latestZennArticleEn = latestZennArticle.locales.en ?? latestZennArticle.locales.ja;
const latestRelease = activityData.releases[0]!;
const latestReleaseRepoName = latestRelease.repo.split("/").at(-1)!;
const homePageContentJa = getHomePageContent("ja");
const homePageContentEn = getHomePageContent("en");
const homePageContentZhHant = getHomePageContent("zh-hant");
const homeHeroJa = getProfileContent("ja").home;
const homeHeroEn = getProfileContent("en").home;
const homeHeroZhHant = getProfileContent("zh-hant").home;
const mobileViewport = { width: 375, height: 812 };
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9sX6s2sAAAAASUVORK5CYII=",
  "base64",
);

function createCoverRoutePattern(coverUrl: string) {
  const normalized = coverUrl.startsWith("/")
    ? new URL(coverUrl, "https://mackysoft.net")
    : new URL(coverUrl);
  return coverUrl.startsWith("/")
    ? `**${normalized.pathname}*`
    : `${normalized.origin}${normalized.pathname}*`;
}

async function fulfillLatestReleaseCover(page: Page, coverUrl: string) {
  await page.route(createCoverRoutePattern(coverUrl), async (route) => {
    await route.fulfill({
      contentType: "image/png",
      body: tinyPng,
    });
  });
}
async function setJapaneseLocale(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("mackysoft-locale", "ja");
  });
}

async function expectMobileHomeGridFullWidth(page: Page, gridSelector: string, itemSelector: string) {
  const grid = page.locator(gridSelector);
  const items = page.locator(`${gridSelector} > ${itemSelector}`);

  if (await items.count() === 0) {
    return;
  }

  const gridBox = await grid.boundingBox();
  const firstItemBox = await items.first().boundingBox();

  if (!gridBox || !firstItemBox) {
    throw new Error("home grid and first item must be visible before mobile width assertions");
  }

  expect(Math.abs(firstItemBox.x - gridBox.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstItemBox.width - gridBox.width)).toBeLessThanOrEqual(2);
}

async function expectTwoColumnHomeGrid(page: Page, gridSelector: string, itemSelector: string) {
  const grid = page.locator(gridSelector);
  const items = page.locator(`${gridSelector} > ${itemSelector}`);

  if (await items.count() < 2) {
    return;
  }

  const gridBox = await grid.boundingBox();
  const firstItemBox = await items.first().boundingBox();
  const secondItemBox = await items.nth(1).boundingBox();

  if (!gridBox || !firstItemBox || !secondItemBox) {
    throw new Error("home grid and first two items must be visible before two-column assertions");
  }

  expect(Math.abs(firstItemBox.x - gridBox.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstItemBox.y - secondItemBox.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstItemBox.width - secondItemBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs((secondItemBox.x + secondItemBox.width) - (gridBox.x + gridBox.width))).toBeLessThanOrEqual(2);
}

async function expectUniformHomeGrid(page: Page, gridSelector: string, itemSelector: string) {
  const grid = page.locator(gridSelector);
  const items = page.locator(`${gridSelector} > ${itemSelector}`);
  const count = await items.count();

  if (count === 0) {
    return;
  }

  const gridBox = await grid.boundingBox();
  const firstItemBox = await items.first().boundingBox();

  if (!gridBox || !firstItemBox) {
    throw new Error("home grid and first item must be visible before layout assertions");
  }

  expect(Math.abs(firstItemBox.x - gridBox.x)).toBeLessThanOrEqual(2);

  const referenceWidth = firstItemBox.width;

  for (let index = 0; index < count; index += 1) {
    const itemBox = await items.nth(index).boundingBox();

    if (!itemBox) {
      throw new Error("home grid item must be visible before width assertions");
    }

    expect(Math.abs(itemBox.width - referenceWidth)).toBeLessThanOrEqual(2);
  }

  if (count === 1) {
    expect(firstItemBox.width).toBeLessThan(gridBox.width - 16);
  }
}

async function expectTitleHeightsUseWholeLines(page: Page, selector: string) {
  const titleMetrics = await page.locator(selector).evaluateAll((elements) => {
    return elements.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        height: rect.height,
        lineHeight: Number.parseFloat(style.lineHeight),
      };
    });
  });

  for (const { height, lineHeight } of titleMetrics) {
    const renderedLines = height / lineHeight;
    expect(Math.abs(renderedLines - Math.round(renderedLines))).toBeLessThanOrEqual(0.12);
  }
}

test.describe("home page", () => {
  test("keeps activity grids aligned from mobile through desktop", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);

    await page.setViewportSize(mobileViewport);
    await page.goto("/");

    await expectMobileHomeGridFullWidth(page, ".latest-articles-grid", ".article-card");
    await expectMobileHomeGridFullWidth(page, ".latest-releases-grid", ".release-card");
    await expectMobileHomeGridFullWidth(page, ".latest-games-grid", ".game-card");

    await page.setViewportSize({ width: 900, height: 900 });
    await page.reload();

    await expectTwoColumnHomeGrid(page, ".latest-articles-grid", ".article-card");
    await expectTwoColumnHomeGrid(page, ".latest-releases-grid", ".release-card");
    await expectTwoColumnHomeGrid(page, ".latest-games-grid", ".game-card");
    await expectTitleHeightsUseWholeLines(page, ".latest-articles-grid .article-card h3");

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.reload();

    await expectUniformHomeGrid(page, ".latest-articles-grid", ".article-card");
    await expectUniformHomeGrid(page, ".latest-releases-grid", ".release-card");
    await expectUniformHomeGrid(page, ".latest-games-grid", ".game-card");
  });

  test("renders the home page as an activity hub", async ({ page }) => {
    await fulfillLatestReleaseCover(page, latestRelease.coverUrl);
    await page.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    await page.goto("/");

    const main = page.getByRole("main");

    await expect(page).toHaveTitle("mackysoft.net");
    await expect(page.getByRole("banner").getByRole("link", { name: "mackysoft.net", exact: true })).toBeVisible();
    await expect(page.locator("main > h1.visually-hidden")).toHaveText(homePageContentJa.homeHeading);
    const homeHero = main.locator("[data-home-hero]");
    const latestArticlesHeading = page.getByRole("heading", { level: 2, name: "最新の記事" });

    await expect(homeHero).toBeVisible();
    await expect(homeHero.getByRole("img", { name: "Makihiro のアイコン" })).toBeVisible();
    await expect(homeHero.locator(".home-hero__name")).toHaveText(homeHeroJa.name);
    await expect(homeHero).toContainText(homeHeroJa.summary);
    await expect(homeHero.getByRole("link", { name: homePageContentJa.heroPrimaryCta, exact: true })).toHaveAttribute("href", "/about/");
    const homeHeroContactCta = homeHero.getByRole("link", { name: homePageContentJa.heroContactCta, exact: true });
    await expect(homeHeroContactCta).toHaveAttribute("href", "/contact/");
    await expect(homeHeroContactCta).toHaveCSS("background-color", "rgb(210, 235, 255)");
    await expect(page.getByRole("heading", { level: 2, name: "仕事・相談と OSS の窓口" })).toHaveCount(0);
    await expect(latestArticlesHeading).toBeVisible();
    await expect(latestArticlesHeading.locator("xpath=preceding-sibling::p[1]")).toHaveText("Latest Articles");
    await expect(page.getByRole("link", { name: latestZennArticleJa.title, exact: true })).toBeVisible();
    const latestArticleCard = main.locator(".article-card").filter({ hasText: "Zenn" }).first();
    await expect(latestArticleCard).toBeVisible();
    await expect(latestArticleCard).toContainText("公開日");
    await expect(latestArticleCard).toContainText(formatContentDate(new Date(latestZennArticle.publishedAt), "ja"));
    await expect(main.locator(".article-card__tags")).toHaveCount(0);
    const latestReleasesHeading = page.getByRole("heading", { level: 2, name: "最新のリリース" });
    await expect(latestReleasesHeading).toBeVisible();
    await expect(latestReleasesHeading.locator("xpath=preceding-sibling::p[1]")).toHaveText("Latest Releases");
    await expect(page.getByRole("link", { name: latestReleaseRepoName, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: homePageContentJa.latestReleasesCta, exact: true })).toHaveAttribute("href", "/assets/");
    await expect(main.locator(".release-card").first()).toBeVisible();
    await expect(main.locator(".release-card").first().locator(".activity-card__link-layer")).toHaveAttribute("href", latestRelease.url);
    await expect(main.locator(".release-card").first().locator(".activity-card__link-layer")).toHaveAttribute("target", "_blank");
    await expect(main.locator(".release-card").first().getByRole("img", { name: latestRelease.coverAlt })).toBeVisible();
    await expect(main.locator(".release-card").first()).toContainText("最新リリース日");
    await expect(main.locator(".release-card").first()).toContainText(
      formatContentDate(new Date(latestRelease.publishedAt)),
    );
    await expect(main.locator(".release-card").first()).toContainText(latestRelease.version);

    if (latestRelease.description) {
      await expect(main.locator(".release-card").first()).toContainText(latestRelease.description);
    }

    if (latestRelease.license) {
      await expect(main.locator(".release-card").first()).toContainText(latestRelease.license);
    }

    const firstReleaseStars = main.locator(".release-card__stars").first();
    await expect(firstReleaseStars).toBeVisible();
    await expect(firstReleaseStars).toHaveCSS("display", "flex");

    const firstReleaseStarIconWidth = await firstReleaseStars.locator(".release-card__star-icon").evaluate((element) => {
      return element.getBoundingClientRect().width;
    });
    expect(firstReleaseStarIconWidth).toBeGreaterThan(8);
    expect(firstReleaseStarIconWidth).toBeLessThan(20);

    const gamesHeading = page.getByRole("heading", { level: 2, name: homePageContentJa.gamesHeading });
    await expect(gamesHeading).toBeVisible();
    await expect(gamesHeading.locator("xpath=preceding-sibling::p[1]")).toHaveText("Games");
    await expect(page.getByRole("link", { name: homePageContentJa.gamesCta, exact: true })).toHaveAttribute("href", "/games/");
    const homeGameCard = main.locator(".game-card").first();
    await expect(homeGameCard).toBeVisible();
    await expect(homeGameCard).toContainText("Treasure Rogue");
    await expect(homeGameCard).toContainText("アーカイブ済み");
    await expect(homeGameCard.getByRole("link", { name: "Treasure Rogue", exact: true })).toHaveAttribute(
      "href",
      "/games/treasure-rogue/",
    );

    const latestReleasesHeadingBox = await latestReleasesHeading.boundingBox();
    const gamesHeadingBox = await gamesHeading.boundingBox();
    const homeHeroBox = await homeHero.boundingBox();
    const latestArticlesHeadingBox = await latestArticlesHeading.boundingBox();

    if (!latestReleasesHeadingBox || !gamesHeadingBox || !homeHeroBox || !latestArticlesHeadingBox) {
      throw new Error("home page section headings must be visible before order assertions");
    }

    expect(homeHeroBox.y).toBeLessThan(latestArticlesHeadingBox.y);
    expect(latestReleasesHeadingBox.y).toBeLessThan(gamesHeadingBox.y);
  });

  test("shows an RSS shortcut on the right side of the footer", { tag: "@size:medium" }, async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    await page.goto("/");

    const footer = page.locator(".site-footer");
    const footerInner = footer.locator(".site-footer__inner");
    const rssLink = footer.getByRole("link", { name: "RSS フィード" });

    await expect(rssLink).toBeVisible();
    await expect(rssLink).toHaveAttribute("href", "/feed.xml");
    await expect(footerInner).toHaveCSS("justify-content", "space-between");
  });

  test("keeps footer links in two columns once there is enough width", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 420, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/");

    const columns = page.locator(".site-footer__columns");
    const firstColumn = page.locator(".site-footer__column").first();
    const secondColumn = page.locator(".site-footer__column").nth(1);
    const rssLink = page.locator(".site-footer__rss-link");

    const columnsBox = await columns.boundingBox();
    const firstColumnBox = await firstColumn.boundingBox();
    const secondColumnBox = await secondColumn.boundingBox();
    const rssLinkBox = await rssLink.boundingBox();

    if (!columnsBox || !firstColumnBox || !secondColumnBox || !rssLinkBox) {
      throw new Error("footer columns and RSS link must be visible before layout assertions");
    }

    expect(Math.abs(firstColumnBox.y - secondColumnBox.y)).toBeLessThanOrEqual(2);
    expect(secondColumnBox.x).toBeGreaterThan(firstColumnBox.x + firstColumnBox.width - 1);
    expect(rssLinkBox.x).toBeGreaterThan(columnsBox.x + columnsBox.width - 1);

    await context.close();
  });

  test("stacks footer links on phone-sized screens", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/");

    const firstColumn = page.locator(".site-footer__column").first();
    const secondColumn = page.locator(".site-footer__column").nth(1);

    const firstColumnBox = await firstColumn.boundingBox();
    const secondColumnBox = await secondColumn.boundingBox();

    if (!firstColumnBox || !secondColumnBox) {
      throw new Error("footer columns must be visible before stack assertions");
    }

    expect(secondColumnBox.y).toBeGreaterThan(firstColumnBox.y + firstColumnBox.height - 1);
    expect(Math.abs(secondColumnBox.x - firstColumnBox.x)).toBeLessThanOrEqual(2);

    await context.close();
  });

  test("redirects the first root visit to /en/ when English is preferred", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("mackysoft-locale");
      Object.defineProperty(window.navigator, "languages", {
        configurable: true,
        value: ["en-US"],
      });
      Object.defineProperty(window.navigator, "language", {
        configurable: true,
        value: "en-US",
      });
    });

    await page.goto("/");

    const homeHero = page.getByRole("main").locator("[data-home-hero]");

    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator("html")).toHaveAttribute("data-ui-locale", "en");
    await expect(homeHero).toBeVisible();
    await expect(homeHero.getByRole("img", { name: "Makihiro avatar" })).toBeVisible();
    await expect(homeHero.locator(".home-hero__name")).toHaveText(homeHeroEn.name);
    await expect(homeHero).toContainText(homeHeroEn.summary);
    await expect(homeHero.getByRole("link", { name: homePageContentEn.heroPrimaryCta, exact: true })).toHaveAttribute("href", "/en/about/");
    await expect(homeHero.getByRole("link", { name: homePageContentEn.heroContactCta, exact: true })).toHaveAttribute("href", "/en/contact/");
    await expect(page.getByRole("heading", { level: 2, name: "Work, consulting, and OSS contact paths" })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "Latest Articles" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Games" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestZennArticleEn.title, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Games", exact: true })).toHaveAttribute("href", "/en/games/");
    await expect(page.getByRole("main").locator(".game-card").first()).toContainText("Treasure Rogue");
    await expect(page.locator(".content-panel").first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgba(240, 249, 255, 0.94)");
  });

  test("redirects the first root visit to /zh-hant/ when Traditional Chinese is preferred", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("mackysoft-locale");
      Object.defineProperty(window.navigator, "languages", {
        configurable: true,
        value: ["zh-TW"],
      });
      Object.defineProperty(window.navigator, "language", {
        configurable: true,
        value: "zh-TW",
      });
    });

    await page.goto("/");

    const homeHero = page.getByRole("main").locator("[data-home-hero]");

    await expect(page).toHaveURL(/\/zh-hant\/$/);
    await expect(page.locator("html")).toHaveAttribute("data-ui-locale", "zh-hant");
    await expect(homeHero).toBeVisible();
    await expect(homeHero.getByRole("img", { name: "Makihiro 頭像" })).toBeVisible();
    await expect(homeHero.locator(".home-hero__name")).toHaveText(homeHeroZhHant.name);
    await expect(homeHero).toContainText(homeHeroZhHant.summary);
    await expect(homeHero.getByRole("link", { name: homePageContentZhHant.heroPrimaryCta, exact: true })).toHaveAttribute(
      "href",
      "/zh-hant/about/",
    );
    await expect(homeHero.getByRole("link", { name: homePageContentZhHant.heroContactCta, exact: true })).toHaveAttribute(
      "href",
      "/zh-hant/contact/",
    );
    await expect(page.getByRole("heading", { level: 2, name: "最新文章" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "遊戲" })).toBeVisible();
    await expect(page.getByRole("link", { name: homePageContentZhHant.gamesCta, exact: true })).toHaveAttribute("href", "/zh-hant/games/");
  });

  test("tracks the redirected English root visit only once", async ({ page }) => {
    await page.addInitScript(() => {
      const storageKey = "__analytics_events__";
      const dataLayer: unknown[] = [];
      const originalPush = Array.prototype.push;

      dataLayer.push = function push(...items: unknown[]) {
        const result = originalPush.apply(this, items);
        const serializedEvents = dataLayer.map((item) => {
          if (!item || typeof item !== "object" || !("length" in item)) {
            return item;
          }

          return Array.from(item as ArrayLike<unknown>, (value) => {
            return value instanceof Date ? value.toISOString() : value;
          });
        });

        window.sessionStorage.setItem(storageKey, JSON.stringify(serializedEvents));
        return result;
      };

      window.sessionStorage.removeItem(storageKey);
      window.localStorage.removeItem("mackysoft-locale");
      Object.defineProperty(window, "dataLayer", {
        configurable: true,
        writable: true,
        value: dataLayer,
      });
      Object.defineProperty(window.navigator, "languages", {
        configurable: true,
        value: ["en-US"],
      });
      Object.defineProperty(window.navigator, "language", {
        configurable: true,
        value: "en-US",
      });
    });

    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/$/);

    const configEvents = await page.evaluate(() => {
      const storedEvents = window.sessionStorage.getItem("__analytics_events__");
      const events = storedEvents ? JSON.parse(storedEvents) : [];

      return events.filter((event: unknown) => Array.isArray(event) && event[0] === "config");
    });

    expect(configEvents).toHaveLength(1);
    expect(configEvents[0]).toMatchObject([
      "config",
      "G-TEST123456",
      {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      },
    ]);
  });

  test("preserves search and hash when the root page redirects to English", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("mackysoft-locale");
      Object.defineProperty(window.navigator, "languages", {
        configurable: true,
        value: ["en-US"],
      });
      Object.defineProperty(window.navigator, "language", {
        configurable: true,
        value: "en-US",
      });
    });

    await page.goto("/?utm=test#top");

    await expect(page).toHaveURL("/en/?utm=test#top");
  });

  test("does not auto-redirect deep URLs when English is preferred", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("mackysoft-locale");
      Object.defineProperty(window.navigator, "languages", {
        configurable: true,
        value: ["en-US"],
      });
      Object.defineProperty(window.navigator, "language", {
        configurable: true,
        value: "en-US",
      });
    });

    await page.goto("/articles/vision-introduction/");

    await expect(page).toHaveURL(/\/articles\/vision-introduction\/$/);
    await expect(page.locator("html")).toHaveAttribute("data-ui-locale", "ja");
    await expect(page.locator(".article-fallback-notice")).toHaveCount(0);
  });

  test("does not break browser back after a manual locale switch", async ({ page }) => {
    await page.goto("/about/");
    await page.goto("/");
    await page.locator("[data-site-language-toggle]").click();
    await page.getByRole("menuitemradio", { name: "English" }).click();
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL("/en/");

    await page.goBack();

    await expect(page).toHaveURL("/about/");
    await expect(page.locator("html")).toHaveAttribute("data-ui-locale", "ja");
    await expect(page.getByRole("heading", { level: 1, name: "プロフィール" })).toBeVisible();
  });

  test("falls back to a local cover treatment when release images fail", async ({ page }) => {
    await page.route(createCoverRoutePattern(latestRelease.coverUrl), async (route) => {
      await route.abort();
    });
    await page.goto("/");

    const firstReleaseCard = page.locator(".release-card").first();
    const firstFallback = firstReleaseCard.locator(".release-card__cover-fallback");

    await expect(firstReleaseCard.locator(".release-card__cover")).toHaveAttribute("data-cover-state", "error");
    await expect(firstFallback).toBeVisible();
    await expect(firstFallback).toContainText("GitHub");
    await expect(firstFallback).toContainText(latestReleaseRepoName);
  });

  test("returns 404 for draft article routes", async ({ page }) => {
    const response = await page.goto("/articles/round-floor-ceil/");

    expect(response?.status()).toBe(404);
  });
});
