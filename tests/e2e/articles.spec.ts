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
  test("shows local and Zenn articles in the same card format", { tag: "@size:medium" }, async ({ page }) => {
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

  test("keeps the article hero layout while separating the breadcrumb", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/vision-introduction/");

    const main = page.getByRole("main");
    const pageHeader = main.locator(".article-page-header");
    const hero = main.locator(".article-hero");
    const toc = main.locator(".article-toc");
    const breadcrumb = pageHeader.getByText("Home / Articles", { exact: true });
    const cover = hero.locator(".cover");
    const title = hero.getByRole("heading", { level: 1, name: "【Unity】CullingGroupをより簡単に実装する【Vision】" });
    const meta = hero.locator(".meta");
    const prose = main.locator(".article-content");
    const bodyTags = prose.locator(".article-content__tags");

    await expect(breadcrumb).toBeVisible();
    await expect(hero.getByText("Home / Articles", { exact: true })).toHaveCount(0);
    await expect(cover.getByRole("img", { name: "【Unity】CullingGroupをより簡単に実装する【Vision】 の記事画像" })).toBeVisible();
    await expect(title).toBeVisible();
    await expect(meta).toContainText("公開日：2021/03/16");
    await expect(meta).toContainText("更新日：2021/03/17");
    await expect(meta).toHaveCSS("justify-content", "center");
    await expect(hero.locator(".tags")).toHaveCount(0);
    await expect(bodyTags).toBeVisible();
    await expect(bodyTags.getByRole("link", { name: "asset", exact: true })).toBeVisible();
    await expect(bodyTags.getByRole("link", { name: "unity", exact: true })).toBeVisible();
    await expect(hero).not.toContainText("「オブジェクトが見えているかどうか」");
    await expect(toc).toBeVisible();
    await expect(toc.getByRole("heading", { level: 2, name: "目次" })).toBeVisible();
    await expect(toc.getByRole("link", { name: "CullingGroup APIとは？", exact: true })).toHaveAttribute("href", "#cullinggroup-apiとは");
    await expect(toc.getByRole("link", { name: "１．Culling Group Proxyを作成する", exact: true })).toHaveAttribute(
      "href",
      "#１culling-group-proxyを作成する",
    );
    await expect(toc).toHaveCSS("position", "sticky");

    const breadcrumbBox = await breadcrumb.boundingBox();
    const coverBox = await cover.boundingBox();
    const titleBox = await title.boundingBox();
    const metaBox = await meta.boundingBox();
    const tagsBox = await bodyTags.boundingBox();
    const tocBox = await toc.boundingBox();
    const proseBox = await prose.boundingBox();

    if (!breadcrumbBox || !coverBox || !titleBox || !metaBox || !tagsBox || !tocBox || !proseBox) {
      throw new Error("article hero elements must be visible before order assertions");
    }

    expect(breadcrumbBox.y).toBeLessThan(coverBox.y);
    expect(coverBox.y).toBeLessThan(titleBox.y);
    expect(titleBox.y).toBeLessThan(metaBox.y);
    expect(coverBox.y).toBeLessThan(proseBox.y);
    expect(tagsBox.y).toBeGreaterThanOrEqual(proseBox.y);
    expect(tocBox.x).toBeGreaterThan(proseBox.x);
  });
});
