import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  articles: Array<{ title: string }>;
  releases: Array<{ repo: string; coverAlt: string }>;
};
const latestZennArticle = activityData.articles[0]!;
const latestRelease = activityData.releases[0]!;
const latestReleaseRepoName = latestRelease.repo.split("/").at(-1)!;

test.describe("home page", () => {
  test("renders the home page as an activity hub", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("mackysoft.net");
    await expect(page.getByRole("heading", { level: 1, name: "mackysoft.net" })).toBeVisible();
    await expect(page.getByText("静かな技術系ポートフォリオ")).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Articles", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "最新の記事" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestZennArticle.title, exact: true })).toBeVisible();
    await expect(page.getByRole("main").locator(".article-card").filter({ hasText: "Zenn" }).first()).toBeVisible();
    await expect(page.getByRole("main").locator(".article-card__tags")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2, name: "最新のリリース" })).toBeVisible();
    await expect(page.getByRole("link", { name: latestReleaseRepoName, exact: true })).toBeVisible();
    await expect(page.getByRole("main").locator(".release-card").first()).toBeVisible();
    await expect(page.getByRole("img", { name: latestRelease.coverAlt }).first()).toBeVisible();

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
