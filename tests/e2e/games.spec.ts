import { expect, test } from "@playwright/test";

test.describe("games page", () => {
  test("shows game cards with status labels on the index page", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/games/");

    const main = page.getByRole("main");
    const treasureRogueCard = main.locator(".game-card").filter({ hasText: "Treasure Rogue" }).first();

    await expect(main.getByText("Home / Games", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "Games" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Games", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(treasureRogueCard).toBeVisible();
    await expect(treasureRogueCard).toContainText("アーカイブ");
    await expect(treasureRogueCard).toContainText("Android");
    await expect(treasureRogueCard).toContainText("ブラウザ");
    await expect(treasureRogueCard).toContainText("2020年4月9日");
    await expect(treasureRogueCard).not.toContainText("2020年5月21日");
    await expect(
      treasureRogueCard.getByRole("img", { name: "Treasure Rogue のタイトルロゴと主人公が写ったキービジュアル" }),
    ).toBeVisible();
    await expect(treasureRogueCard.getByRole("link", { name: "Treasure Rogue", exact: true })).toHaveAttribute(
      "href",
      "/games/treasure-rogue/",
    );
  });

  test("renders the game detail page with hero, features, screenshots, and action panel", { tag: "@size:medium" }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.goto("/games/treasure-rogue/");

    const main = page.getByRole("main");
    const breadcrumb = main.locator(".game-page__eyebrow");
    const hero = main.locator(".game-hero");
    const detailLayout = main.locator(".game-detail-layout");
    const mainColumn = detailLayout.locator(".game-detail-main");
    const featuresSection = mainColumn.locator('.game-section[aria-label="ゲームの特徴"]');
    const screenshotSection = mainColumn.locator('.game-screenshot-gallery[aria-label="スクリーンショット"]');
    const actionPanel = detailLayout.locator(".game-action-panel");
    const actionCard = actionPanel.locator(".game-action-panel__inner");
    const heroCover = hero.locator(".game-hero__cover");
    const heroTitle = hero.getByRole("heading", { level: 1, name: "Treasure Rogue" });
    const heroDate = hero.locator(".game-hero__date");
    const heroDescription = hero.locator(".game-hero__description");

    await expect(breadcrumb).toHaveText("Home / Games");
    await expect(page.locator(".site-header")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Games", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(heroTitle).toBeVisible();
    await expect(hero).toContainText("拾ったアイテムを駆使して敵を倒しながら突き進もう！ アナタはどれだけ奥に進めるかな？");
    await expect(hero).toContainText("アーカイブ");
    await expect(hero).toContainText("Android");
    await expect(hero).toContainText("ブラウザ");
    await expect(heroDate).toHaveText("公開日: 2020/04/09");
    await expect(hero).not.toContainText("更新日: 2020/05/21");
    await expect(heroCover.getByRole("img", { name: "Treasure Rogue のタイトルロゴと主人公が写ったキービジュアル" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "About" })).toHaveCount(0);
    await expect(main.getByRole("heading", { level: 2, name: "特徴" })).toHaveCount(0);
    await expect(featuresSection.locator(".game-feature-list > li")).toHaveCount(5);
    await expect(featuresSection).toContainText("プレイするたびにランダムで地形が自動生成されるローグライク要素。奥に進めば新しい世界が待っている！");
    await expect(screenshotSection.locator('iframe[title="Treasure Rogue のトレーラー"]')).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/ICE8Qz0S23o",
    );
    await expect(main.getByRole("heading", { level: 2, name: "スクリーンショット" })).toHaveCount(0);
    await expect(main.getByRole("img", { name: "宝箱を3つ並べた開始直後のプレイ画面" })).toBeVisible();
    await expect(main.getByRole("img", { name: "雪原エリアで敵と対峙しているプレイ画面" })).toBeVisible();
    await expect(main.getByRole("img", { name: "森林エリアを探索しているプレイ画面" })).toBeVisible();
    await expect(main.getByRole("img", { name: "インベントリと取得アイテムを確認している画面" })).toBeVisible();

    await expect(main.getByRole("heading", { level: 2, name: "リンク" })).toHaveCount(0);
    const primaryAction = actionCard.getByRole("link", { name: "unityroom で遊ぶ", exact: true });
    await expect(primaryAction).toHaveAttribute(
      "href",
      "https://unityroom.com/games/treasure-rogue",
    );
    await expect(primaryAction).toHaveCSS("background-color", "rgb(76, 175, 80)");
    await expect(actionCard.getByRole("link")).toHaveCount(1);
    await expect(actionCard.getByRole("link", { name: /Google Play|Press Kit|配信ガイドライン/ })).toHaveCount(0);
    await expect(actionPanel).toHaveCSS("position", "sticky");

    const featuresBox = await featuresSection.boundingBox();
    const screenshotsBox = await screenshotSection.boundingBox();
    const actionBox = await actionPanel.boundingBox();
    const mainColumnBox = await mainColumn.boundingBox();
    const heroCoverBox = await heroCover.boundingBox();
    const breadcrumbBox = await breadcrumb.boundingBox();
    const heroTitleBox = await heroTitle.boundingBox();
    const heroDateBox = await heroDate.boundingBox();
    const heroDescriptionBox = await heroDescription.boundingBox();

    if (!featuresBox || !screenshotsBox || !actionBox || !mainColumnBox || !heroCoverBox || !breadcrumbBox || !heroTitleBox || !heroDateBox || !heroDescriptionBox) {
      throw new Error("game detail elements must be visible before order assertions");
    }

    expect(breadcrumbBox.y).toBeLessThan(heroCoverBox.y);
    expect(heroCoverBox.y).toBeLessThan(heroTitleBox.y);
    expect(heroTitleBox.y).toBeLessThan(heroDateBox.y);
    expect(heroDateBox.y).toBeLessThan(heroDescriptionBox.y);
    expect(featuresBox.y).toBeLessThan(screenshotsBox.y);
    expect(actionBox.x).toBeGreaterThan(mainColumnBox.x);
  });
});
