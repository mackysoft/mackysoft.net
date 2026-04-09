import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  articles: Array<{ title: string }>;
};
const latestZennArticle = activityData.articles[0]!;

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
  });

  test("returns 404 for draft article routes", async ({ page }) => {
    const response = await page.goto("/articles/round-floor-ceil/");

    expect(response?.status()).toBe(404);
  });
});
