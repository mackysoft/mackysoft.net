import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const activityData = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "../../src/generated/activity.json"), "utf8"),
) as {
  articles: Array<{ title: string; url: string }>;
};
const latestZennArticle = activityData.articles[0]!;

test.describe("articles page", () => {
  test("shows local and Zenn articles in the same card format", async ({ page }) => {
    await page.goto("/articles/");

    await expect(page.getByText("Home / Articles", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Articles" })).toBeVisible();
    await expect(page.getByText("mackysoft.net に移行した記事と、Zenn に公開した記事を時系列でまとめています。")).toHaveCount(0);
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
});
