import { expect, test } from "@playwright/test";

test.describe("games page", () => {
  test("shows game cards with status labels on the index page", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/games/");

    const main = page.getByRole("main");
    const treasureRogueCard = main.locator(".game-card").filter({ hasText: "Treasure Rogue" }).first();

    await expect(main.locator(".page-header .eyebrow")).toHaveText("Home / Games");
    await expect(main.getByRole("heading", { level: 1, name: "Games" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Games", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(treasureRogueCard).toBeVisible();
    await expect(treasureRogueCard).toContainText("アーカイブ済み");
    await expect(treasureRogueCard).toContainText("Android（配信終了）");
    await expect(treasureRogueCard).toContainText("ブラウザ");
    await expect(treasureRogueCard).toContainText("公開日");
    await expect(treasureRogueCard).toContainText("2020/04/09");
    await expect(treasureRogueCard).not.toContainText("2020/05/21");
    await expect(
      treasureRogueCard.getByRole("img", { name: "Treasure Rogue のタイトルロゴと主人公が写ったキービジュアル" }),
    ).toBeVisible();
    await expect(treasureRogueCard.getByRole("link", { name: "Treasure Rogue", exact: true })).toHaveAttribute(
      "href",
      "/games/treasure-rogue/",
    );
  });

  test("shows translated metadata on the English games index page", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/games/");

    const main = page.getByRole("main");
    const treasureRogueCard = main.locator(".game-card").filter({ hasText: "Treasure Rogue" }).first();

    await expect(main.locator(".page-header .eyebrow")).toHaveText("Home / Games");
    await expect(main.getByRole("heading", { level: 1, name: "Games" })).toBeVisible();
    await expect(treasureRogueCard).toContainText("Archived");
    await expect(treasureRogueCard).toContainText("Android (discontinued)");
    await expect(treasureRogueCard).toContainText("Browser");
    await expect(treasureRogueCard).toContainText("Published");
    await expect(treasureRogueCard).toContainText("2020/04/09");
    await expect(treasureRogueCard).toContainText("Defeat enemies with the items you find and keep pushing deeper. How far can you make it?");
    await expect(treasureRogueCard).not.toContainText("Japanese only");
    await expect(
      treasureRogueCard.getByRole("img", { name: "Key visual featuring the Treasure Rogue logo and the main cube hero" }),
    ).toBeVisible();
    await expect(treasureRogueCard.getByRole("link", { name: "Treasure Rogue", exact: true })).toHaveAttribute(
      "href",
      "/en/games/treasure-rogue/",
    );
  });

  test("navigates from anywhere on a game card", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/games/");

    await page.locator(".game-card").first().click();

    await expect(page).toHaveURL("/games/treasure-rogue/");
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
    const detailTable = main.locator('.game-detail-table[aria-label="ゲームの基本情報"]');
    const heroCover = hero.locator(".game-hero__cover");
    const heroTitle = hero.getByRole("heading", { level: 1, name: "Treasure Rogue" });
    const heroDescription = hero.locator(".game-hero__description");

    await expect(breadcrumb).toHaveText("Home / Games");
    await expect(page.locator(".site-header")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Games", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(heroTitle).toBeVisible();
    await expect(hero).toContainText("拾ったアイテムを駆使して敵を倒しながら突き進もう！ アナタはどれだけ奥に進めるかな？");
    await expect(hero).toContainText("アーカイブ済み");
    await expect(hero).not.toContainText("Android（配信終了）");
    await expect(hero).not.toContainText("ブラウザ");
    await expect(hero).not.toContainText("公開日");
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
    await expect(detailTable).toContainText("ジャンル");
    await expect(detailTable).toContainText("ローグライク");
    await expect(detailTable).toContainText("公開日");
    await expect(detailTable).toContainText("2020/04/09");
    await expect(detailTable).toContainText("対応言語");
    await expect(detailTable).toContainText("日本語 / 英語");
    await expect(detailTable).toContainText("プラットフォーム");
    await expect(detailTable).toContainText("Android（配信終了） / ブラウザ");

    const featuresBox = await featuresSection.boundingBox();
    const screenshotsBox = await screenshotSection.boundingBox();
    const actionBox = await actionPanel.boundingBox();
    const mainColumnBox = await mainColumn.boundingBox();
    const detailTableBox = await detailTable.boundingBox();
    const heroCoverBox = await heroCover.boundingBox();
    const breadcrumbBox = await breadcrumb.boundingBox();
    const heroTitleBox = await heroTitle.boundingBox();
    const heroDescriptionBox = await heroDescription.boundingBox();

    if (!featuresBox || !screenshotsBox || !actionBox || !mainColumnBox || !detailTableBox || !heroCoverBox || !breadcrumbBox || !heroTitleBox || !heroDescriptionBox) {
      throw new Error("game detail elements must be visible before order assertions");
    }

    expect(breadcrumbBox.y).toBeLessThan(heroCoverBox.y);
    expect(heroCoverBox.y).toBeLessThan(heroTitleBox.y);
    expect(heroTitleBox.y).toBeLessThan(heroDescriptionBox.y);
    expect(featuresBox.y).toBeLessThan(screenshotsBox.y);
    expect(screenshotsBox.y).toBeLessThan(detailTableBox.y);
    expect(actionBox.x).toBeGreaterThan(mainColumnBox.x);
  });

  test("renders the translated English game detail page without fallback UI", { tag: "@size:medium" }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 960 });
    await page.goto("/en/games/treasure-rogue/");

    const main = page.getByRole("main");
    const hero = main.locator(".game-hero");
    const detailTable = main.locator('.game-detail-table[aria-label="Game details"]');
    const actionPanel = main.locator(".game-action-panel");
    const featuresSection = main.locator('.game-section[aria-label="Game features"]');
    const screenshotSection = main.locator('.game-screenshot-gallery[aria-label="Screenshots"]');

    await expect(page.locator(".game-fallback-notice")).toHaveCount(0);
    await expect(main.locator(".game-page__eyebrow")).toHaveText("Home / Games");
    await expect(hero.getByRole("heading", { level: 1, name: "Treasure Rogue" })).toBeVisible();
    await expect(hero).toContainText("Defeat enemies with the items you find and keep pushing deeper. How far can you make it?");
    await expect(hero).toContainText("Archived");
    await expect(hero.getByRole("img", { name: "Key visual featuring the Treasure Rogue logo and the main cube hero" })).toBeVisible();
    await expect(featuresSection).toContainText("A roguelike adventure where the terrain is generated every time you play.");
    await expect(screenshotSection.locator('iframe[title="Treasure Rogue trailer"]')).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/ICE8Qz0S23o",
    );
    await expect(main.getByRole("img", { name: "Opening gameplay scene with three treasure chests lined up" })).toBeVisible();
    await expect(main.getByRole("img", { name: "Gameplay scene facing an enemy in the snow biome" })).toBeVisible();
    await expect(detailTable).toContainText("Genre");
    await expect(detailTable).toContainText("Roguelike");
    await expect(detailTable).toContainText("Published");
    await expect(detailTable).toContainText("2020/04/09");
    await expect(detailTable).toContainText("Languages");
    await expect(detailTable).toContainText("Japanese / English");
    await expect(detailTable).toContainText("Platforms");
    await expect(detailTable).toContainText("Android (discontinued) / Browser");
    await expect(actionPanel.getByRole("link", { name: "Play on unityroom", exact: true })).toHaveAttribute(
      "href",
      "https://unityroom.com/games/treasure-rogue",
    );
  });
});
