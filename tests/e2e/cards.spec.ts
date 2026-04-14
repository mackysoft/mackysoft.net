import { expect, test, type Locator, type Page } from "@playwright/test";

const mobileViewport = { width: 375, height: 812 };
const localSearchQuery = "BoundingSphereUpdateMode";

async function setJapaneseLocale(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("mackysoft-locale", "ja");
  });
}

async function expectCardFooterWithinBounds(card: Locator, footer: Locator) {
  const cardBox = await card.boundingBox();
  const footerBox = await footer.boundingBox();

  if (!cardBox || !footerBox) {
    throw new Error("card and footer must be visible before layout assertions");
  }

  expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height + 1);
}

test.describe("mobile cards", () => {
  test("keep thumbnails visible and hide descriptive copy on narrow screens", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: mobileViewport, colorScheme: "light" });
    const page = await context.newPage();
    await setJapaneseLocale(page);

    await page.goto("/articles/");

    const articleCard = page.locator(".article-card:not(.article-card--no-cover)").first();
    await expect(articleCard.locator(".article-card__cover")).toBeVisible();
    await expect(articleCard.locator(".article-card__description")).toBeHidden();
    await expect(articleCard.locator(".article-card__meta")).toBeVisible();
    await expectCardFooterWithinBounds(articleCard, articleCard.locator(".article-card__meta"));

    await page.goto("/");

    const releaseCard = page.locator(".release-card").first();
    await expect(releaseCard.locator(".release-card__cover")).toBeVisible();
    await expect(releaseCard.locator(".release-card__description")).toBeHidden();
    await expect(releaseCard.locator(".release-card__footer")).toBeVisible();
    await expectCardFooterWithinBounds(releaseCard, releaseCard.locator(".release-card__footer"));

    await page.goto("/games/");

    const gameCard = page.locator(".game-card").first();
    await expect(gameCard.locator(".game-card__cover")).toBeVisible();
    await expect(gameCard.locator(".game-card__description")).toBeHidden();
    await expect(gameCard.locator(".game-card__footer")).toBeVisible();
    await expectCardFooterWithinBounds(gameCard, gameCard.locator(".game-card__footer"));

    await page.goto("/assets/");

    const assetCard = page.locator(".asset-card").first();
    await expect(assetCard.locator(".asset-card__cover")).toBeVisible();
    await expect(assetCard.locator(".asset-card__description")).toBeHidden();
    await expect(assetCard.locator(".asset-card__footer")).toBeVisible();
    await expectCardFooterWithinBounds(assetCard, assetCard.locator(".asset-card__footer"));

    await page.goto(`/search/?q=${encodeURIComponent(localSearchQuery)}`);

    const searchCard = page.locator(".site-search-card").first();
    await expect(searchCard.locator(".site-search-card__cover")).toBeVisible();
    await expect(searchCard.locator(".site-search-card__excerpt")).toBeHidden();
    await expect(searchCard.locator(".site-search-card__footer")).toBeVisible();
    await expectCardFooterWithinBounds(searchCard, searchCard.locator(".site-search-card__footer"));

    await context.close();
  });
});
