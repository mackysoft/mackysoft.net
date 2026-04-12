import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { formatContentDate } from "../../src/lib/content-date";

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
test.describe("home page", () => {
  test("renders the home page as an activity hub", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    await page.goto("/");

    await expect(page).toHaveTitle("mackysoft.net");
    await expect(page.getByRole("banner").getByRole("link", { name: "mackysoft.net", exact: true })).toBeVisible();
    await expect(page.locator("main > h1.visually-hidden")).toHaveText("Home");
    await expect(page.getByRole("heading", { level: 2, name: "最新の記事" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestZennArticleJa.title, exact: true })).toBeVisible();
    const latestArticleCard = page.getByRole("main").locator(".article-card").filter({ hasText: "Zenn" }).first();
    await expect(latestArticleCard).toBeVisible();
    await expect(latestArticleCard).toContainText("公開日");
    await expect(latestArticleCard).toContainText(formatContentDate(new Date(latestZennArticle.publishedAt), "ja"));
    await expect(page.getByRole("main").locator(".article-card__tags")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "最新のリリース" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestReleaseRepoName, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Assets", exact: true })).toHaveAttribute("href", "/assets/");
    await expect(page.getByRole("main").locator(".release-card").first()).toBeVisible();
    await expect(page.getByRole("main").locator(".release-card").first().locator(".activity-card__link-layer")).toHaveAttribute("href", latestRelease.url);
    await expect(page.getByRole("main").locator(".release-card").first().locator(".activity-card__link-layer")).toHaveAttribute("target", "_blank");
    await expect(page.getByRole("img", { name: latestRelease.coverAlt }).first()).toBeVisible();
    await expect(page.getByRole("main").locator(".release-card").first()).toContainText("最新リリース日");
    await expect(page.getByRole("main").locator(".release-card").first()).toContainText(
      formatContentDate(new Date(latestRelease.publishedAt)),
    );
    await expect(page.getByRole("main").locator(".release-card").first()).toContainText(latestRelease.version);

    if (latestRelease.description) {
      await expect(page.getByRole("main").locator(".release-card").first()).toContainText(latestRelease.description);
    }

    if (latestRelease.license) {
      await expect(page.getByRole("main").locator(".release-card").first()).toContainText(latestRelease.license);
    }

    const firstReleaseStars = page.getByRole("main").locator(".release-card__stars").first();
    await expect(firstReleaseStars).toBeVisible();
    await expect(firstReleaseStars).toHaveCSS("display", "flex");

    const firstReleaseStarIconWidth = await firstReleaseStars.locator(".release-card__star-icon").evaluate((element) => {
      return element.getBoundingClientRect().width;
    });
    expect(firstReleaseStarIconWidth).toBeGreaterThan(8);
    expect(firstReleaseStarIconWidth).toBeLessThan(20);
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

    await expect(page).toHaveURL(/\/en\/$/);
    await expect(page.locator("html")).toHaveAttribute("data-ui-locale", "en");
    await expect(page.getByRole("heading", { level: 2, name: "Latest Articles" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestZennArticleEn.title, exact: true })).toBeVisible();
    await expect(page.locator(".content-panel").first()).toHaveCSS("background-color", "rgba(255, 252, 246, 0.78)");
    await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgba(245, 241, 232, 0.9)");
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
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
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
