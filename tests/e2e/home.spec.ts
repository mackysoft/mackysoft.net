import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

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
const homeHeroJa = getProfileContent("ja").home;
const homeHeroEn = getProfileContent("en").home;

test.describe("home page", () => {
  test("renders the home page as an activity hub", async ({ page }) => {
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
    await expect(homeHero.getByRole("link", { name: homePageContentJa.heroContactCta, exact: true })).toHaveAttribute("href", "/contact/");
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
    await expect(page.getByRole("img", { name: latestRelease.coverAlt }).first()).toBeVisible();
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
    await expect(page.locator(".content-panel").first()).toHaveCSS("background-color", "rgba(255, 252, 246, 0.78)");
    await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgba(245, 241, 232, 0.9)");
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
    await page.route("https://opengraph.githubassets.com/**", async (route) => {
      await route.abort();
    });
    await page.route("https://repository-images.githubusercontent.com/**", async (route) => {
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
