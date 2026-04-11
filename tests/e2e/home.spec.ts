import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { formatArticleDate } from "../../src/lib/article-dates";

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  articles: Array<{ title: string; publishedAt: string }>;
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
const latestRelease = activityData.releases[0]!;
const latestReleaseRepoName = latestRelease.repo.split("/").at(-1)!;
const secondLatestRelease = activityData.releases
  .toSorted((left, right) => right.publishedAt.localeCompare(left.publishedAt))[1];

test.describe("home page", () => {
  test("renders the home page as an activity hub", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("mackysoft.net");
    await expect(page.getByRole("banner").getByRole("link", { name: "mackysoft.net", exact: true })).toBeVisible();
    await expect(page.locator("main > h1.visually-hidden")).toHaveText("Home");
    await expect(page.getByRole("heading", { level: 2, name: "最新の記事" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestZennArticle.title, exact: true })).toBeVisible();
    const latestArticleCard = page.getByRole("main").locator(".article-card").filter({ hasText: "Zenn" }).first();
    await expect(latestArticleCard).toBeVisible();
    await expect(latestArticleCard).toContainText("公開日");
    await expect(latestArticleCard).toContainText(formatArticleDate(new Date(latestZennArticle.publishedAt)));
    await expect(page.getByRole("main").locator(".article-card__tags")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "最新のリリース" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestReleaseRepoName, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Assets", exact: true })).toHaveAttribute("href", "/assets/");
    await expect(page.getByRole("main").locator(".release-card").first()).toBeVisible();
    await expect(page.getByRole("img", { name: latestRelease.coverAlt }).first()).toBeVisible();
    await expect(page.getByRole("main").locator(".release-card").first()).toContainText("最新リリース日");
    await expect(page.getByRole("main").locator(".release-card").first()).toContainText(
      formatArticleDate(new Date(latestRelease.publishedAt)),
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

  test("returns 404 for draft article routes", async ({ page }) => {
    const response = await page.goto("/articles/round-floor-ceil/");

    expect(response?.status()).toBe(404);
  });
});

test.describe("assets page", () => {
  test("shows GitHub releases in descending order with asset cards", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/assets/");

    await expect(page.getByText("Home / Assets", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Assets" })).toBeVisible();

    const firstCard = page.locator(".asset-card").first();

    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByRole("link", { name: latestReleaseRepoName, exact: true })).toHaveAttribute("href", latestRelease.url);
    await expect(firstCard.getByRole("img", { name: latestRelease.coverAlt })).toBeVisible();
    await expect(firstCard).toContainText("最新リリース日");
    await expect(firstCard).toContainText(formatArticleDate(new Date(latestRelease.publishedAt)));
    await expect(firstCard).toContainText(latestRelease.version);

    if (latestRelease.description) {
      await expect(firstCard).toContainText(latestRelease.description);
    }

    if (latestRelease.license) {
      await expect(firstCard).toContainText(latestRelease.license);
    }

    await expect(firstCard.locator(".asset-card__stars")).toBeVisible();
    await expect(page.locator(".asset-card").filter({ hasText: "Unity-GitHubActions-ExportPackage-Example" })).toHaveCount(0);
    await expect(page.locator(".asset-card").filter({ hasText: "UniData" })).toHaveCount(0);

    if (secondLatestRelease) {
      const secondRepoName = secondLatestRelease.repo.split("/").at(-1)!;
      await expect(page.locator(".asset-card").nth(1).getByRole("link", { name: secondRepoName, exact: true })).toBeVisible();
    }
  });
});
