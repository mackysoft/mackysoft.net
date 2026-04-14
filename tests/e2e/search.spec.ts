import { expect, test, type Page } from "@playwright/test";

const localSearchQuery = "BoundingSphereUpdateMode";
const localArticleWithoutCoverQuery = "コントラスト";
const externalSearchQuery = "Vibe駆動開発";
const releaseSearchQuery = "SerializeReference";
const articleUiQuery = "コピーリンク";
const overflowSearchQuery = "C#";

async function setJapaneseLocale(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("mackysoft-locale", "ja");
  });
}

test.describe("site search", () => {
  test("opens the inline panel from the header and returns focus when it closes", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const trigger = page.locator('[data-site-search-trigger]');
    await trigger.click();

    const panel = page.locator("[data-site-search-inline]");
    const input = panel.locator("[data-site-search-input]");

    await expect(panel).toBeVisible();
    await expect(input).toBeFocused();

    const { scrollX, panelLeft, panelRight, triggerRight } = await page.evaluate(() => {
      const panel = document.querySelector("[data-site-search-inline]");
      const trigger = document.querySelector("[data-site-search-trigger]");
      const rect = panel instanceof HTMLElement ? panel.getBoundingClientRect() : null;
      const triggerRect = trigger instanceof HTMLElement ? trigger.getBoundingClientRect() : null;

      return {
        scrollX: window.scrollX,
        panelLeft: rect?.left ?? null,
        panelRight: rect?.right ?? null,
        triggerRight: triggerRect?.right ?? null,
      };
    });

    expect(scrollX).toBe(0);
    expect(panelLeft).not.toBeNull();
    expect(panelRight).not.toBeNull();
    expect(triggerRight).not.toBeNull();
    expect(panelLeft!).toBeGreaterThanOrEqual(-1);
    expect(Math.abs(panelRight! - triggerRight!)).toBeLessThanOrEqual(1);

    await input.fill(localSearchQuery);

    const firstCard = panel.locator(".site-search-card").first();
    const localArticleCard = panel.locator(".site-search-card").filter({
      has: page.locator('.activity-card__link-layer[href*="vision-introduction"]'),
    }).first();

    await expect(firstCard.locator(".site-search-card__cover")).toHaveCount(0);
    await expect(firstCard.locator(".site-search-card__excerpt")).toContainText(localSearchQuery);
    await expect(localArticleCard).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(panel).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test("navigates to the dedicated search page when the inline search is submitted", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto("/");

    await page.locator('[data-site-search-trigger]').click();
    await page.locator('[data-site-search-input]').fill(localSearchQuery);
    await page.locator('[data-site-search-input]').press("Enter");

    await expect(page).toHaveURL(`/search/?q=${encodeURIComponent(localSearchQuery)}`);
    await expect(page.locator(".site-search__summary")).toContainText("件の検索結果");
  });

  test("keeps the inline search width stable on tablet-sized viewports and only clamps when needed", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");

    await page.locator('[data-site-search-trigger]').click();

    const { panelWidth, headerWidth, scrollX, viewportWidth, panelRight, triggerRight } = await page.evaluate(() => {
      const panel = document.querySelector("[data-site-search-inline]");
      const header = document.querySelector(".site-header__inner");
      const trigger = document.querySelector("[data-site-search-trigger]");
      const panelRect = panel instanceof HTMLElement ? panel.getBoundingClientRect() : null;
      const headerRect = header instanceof HTMLElement ? header.getBoundingClientRect() : null;
      const triggerRect = trigger instanceof HTMLElement ? trigger.getBoundingClientRect() : null;

      return {
        panelWidth: panelRect?.width ?? null,
        headerWidth: headerRect?.width ?? null,
        scrollX: window.scrollX,
        viewportWidth: window.innerWidth,
        panelRight: panelRect?.right ?? null,
        triggerRight: triggerRect?.right ?? null,
      };
    });

    expect(scrollX).toBe(0);
    expect(panelWidth).not.toBeNull();
    expect(headerWidth).not.toBeNull();
    expect(panelRight).not.toBeNull();
    expect(triggerRight).not.toBeNull();
    expect(panelWidth!).toBeCloseTo(480, 1);
    expect(panelWidth!).toBeLessThan(viewportWidth);
    expect(headerWidth!).toBeGreaterThan(panelWidth! + 200);
    expect(Math.abs(panelRight! - triggerRight!)).toBeLessThanOrEqual(1);
  });

  test("renders local article hits as cards with an excerpt on the search page", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent(localSearchQuery)}`);

    const card = page.locator(".site-search-card").filter({
      has: page.locator('.activity-card__link-layer[href*="vision-introduction"]'),
    }).first();

    await expect(card).toBeVisible();
    await expect(card.locator(".site-search-card__cover img")).toBeVisible();
    await expect(card.locator(".site-search-card__excerpt")).toContainText(localSearchQuery);
    await expect(page.locator(".site-search__summary")).toContainText("件の検索結果");
  });

  test("prioritizes exact Japanese title matches over broader body matches", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent("ゲームデザイン")}`);

    const firstCard = page.locator(".site-search-card").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator(".activity-card__link-layer")).toHaveAttribute("href", "/articles/gamedesign-contrast-cedec2018/");
  });

  test("uses the generated card-sized image for no-cover local article search hits", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent("ターン制")}`);

    const card = page.locator(".site-search-card").filter({
      has: page.locator('.activity-card__link-layer[href*="turnbased-gameloop"]'),
    }).first();
    const cover = card.locator(".site-search-card__cover img");

    await expect(card).toBeVisible();
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute("src", "/og/articles/cards/turnbased-gameloop.png");
    await expect(cover).toHaveAttribute("alt", "ターン制のゲームループを実装する方法【C#】 の記事タイトル画像");
  });

  test("does not index article share UI labels as searchable content", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent(articleUiQuery)}`);

    const pagePanel = page.locator('[data-search-mode="page"]').first();

    await expect(pagePanel.locator('.activity-card__link-layer[href*="#article-share-title"]')).toHaveCount(0);
  });

  test("uses the generated card-sized image for another no-cover local article search hit", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent(localArticleWithoutCoverQuery)}`);

    const card = page.locator(".site-search-card").filter({
      has: page.locator('.activity-card__link-layer[href*="gamedesign-contrast-cedec2018"]'),
    }).first();
    const cover = card.locator(".site-search-card__cover img");

    await expect(card).toBeVisible();
    await expect(card.locator(".site-search-card__cover")).toBeVisible();
    await expect(cover).toBeVisible();
    await expect(cover).toHaveAttribute("src", "/og/articles/cards/gamedesign-contrast-cedec2018.png");
    await expect(cover).toHaveAttribute("alt", "ゲームを面白くする「コントラスト」【ゲームデザイン】 の記事タイトル画像");
  });

  test("includes external article and release records in the search results", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent(externalSearchQuery)}`);

    const externalCard = page.locator(".site-search-card").filter({
      has: page.locator('.activity-card__link-layer[href^="https://zenn.dev/"]'),
    }).first();

    await expect(externalCard).toBeVisible();
    await expect(externalCard.locator(".activity-card__badge").filter({ hasText: "外部" })).toBeVisible();
    await expect(externalCard.locator(".site-search-card__meta")).toContainText("Zenn");

    await page.goto(`/search/?q=${encodeURIComponent(releaseSearchQuery)}`);

    const releaseCard = page.locator(".site-search-card").filter({
      has: page.locator('.activity-card__link-layer[href*="Unity-SerializeReferenceExtensions"]'),
    }).first();

    await expect(releaseCard).toBeVisible();
    await expect(releaseCard.locator(".site-search-card__meta")).toContainText("GitHub");
  });

  test("shows every result on the dedicated search page even when there are more than twenty matches", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent(overflowSearchQuery)}`);

    const pagePanel = page.locator('[data-search-mode="page"]').first();
    await expect(pagePanel.locator(".site-search__summary")).toContainText("件の検索結果");

    await expect.poll(async () => pagePanel.locator(".site-search-card").count()).toBeGreaterThan(20);
    const count = await pagePanel.locator(".site-search-card").count();
    expect(count).toBeGreaterThan(20);
    await expect(pagePanel.locator(".site-search__summary")).toContainText(`${count} 件の検索結果`);
  });

  test("shows the total match count in inline search even when the preview is capped", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto("/");

    await page.locator('[data-site-search-trigger]').click();
    const inlinePanel = page.locator('[data-site-search-inline]');
    const input = inlinePanel.locator('[data-site-search-input]');
    await input.fill(overflowSearchQuery);

    await expect.poll(async () => inlinePanel.locator(".site-search-card").count()).toBe(20);
    const inlineSummaryText = await inlinePanel.locator(".site-search__summary").textContent();

    await page.goto(`/search/?q=${encodeURIComponent(overflowSearchQuery)}`);

    const pagePanel = page.locator('[data-search-mode="page"]').first();
    await expect.poll(async () => pagePanel.locator(".site-search-card").count()).toBeGreaterThan(20);
    const totalCount = await pagePanel.locator(".site-search-card").count();
    expect(inlineSummaryText).toContain(`${totalCount} 件の検索結果`);
    expect(inlineSummaryText).toContain("上位 20 件を表示");
  });

  test("does not include Japanese-only local pages in English search", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto(`/en/search/?q=${encodeURIComponent("認証の文脈")}`);

    await expect(page.locator(".site-search-card")).toHaveCount(0);
    await expect(page.locator(".site-search__state-title")).toHaveText("No results found");
  });

  test("falls back to the dedicated search page when JavaScript is unavailable", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    await page.goto("/");
    await page.locator('[data-site-search-trigger]').click();

    await expect(page).toHaveURL("/search/");

    await context.close();
  });
});
