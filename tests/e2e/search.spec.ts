import { expect, test, type Page } from "@playwright/test";

const localSearchQuery = "BoundingSphereUpdateMode";
const localArticleWithoutCoverQuery = "コントラスト";
const externalSearchQuery = "Vibe駆動開発";
const releaseSearchQuery = "SerializeReference";

async function setJapaneseLocale(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("mackysoft-locale", "ja");
  });
}

test.describe("site search", () => {
  test("opens the inline panel from the header and returns focus when it closes", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto("/");

    const trigger = page.locator('[data-site-search-trigger]');
    await trigger.click();

    const panel = page.locator("[data-site-search-inline]");
    const input = panel.locator("[data-site-search-input]");

    await expect(panel).toBeVisible();
    await expect(input).toBeFocused();

    await input.fill(localSearchQuery);

    const firstCard = panel.locator(".site-search-card").first();
    await expect(firstCard.locator('.activity-card__link-layer')).toHaveAttribute("href", /vision-introduction/);
    await expect(firstCard.locator(".site-search-card__cover")).toHaveCount(0);
    await expect(firstCard.locator(".site-search-card__excerpt")).toContainText(localSearchQuery);

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

  test("keeps the same card structure when a result does not have a thumbnail", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.goto(`/search/?q=${encodeURIComponent(localArticleWithoutCoverQuery)}`);

    const card = page.locator(".site-search-card").filter({
      has: page.locator('.activity-card__link-layer[href*="gamedesign-contrast-cedec2018"]'),
    }).first();

    await expect(card).toBeVisible();
    await expect(card.locator(".site-search-card__cover")).toBeVisible();
    await expect(card.locator(".site-search-card__cover img")).toHaveCount(0);
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
