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

async function expectUniformHomeGrid(page: Page, gridSelector: string, itemSelector: string) {
  const grid = page.locator(gridSelector);
  const items = page.locator(`${gridSelector} > ${itemSelector}`);
  const count = await items.count();

  if (count === 0) {
    return;
  }

  const gridBox = await grid.boundingBox();
  const firstItemBox = await items.first().boundingBox();

  if (!gridBox || !firstItemBox) {
    throw new Error("home grid and first item must be visible before layout assertions");
  }

  expect(Math.abs(firstItemBox.x - gridBox.x)).toBeLessThanOrEqual(2);

  const referenceWidth = firstItemBox.width;

  for (let index = 0; index < count; index += 1) {
    const itemBox = await items.nth(index).boundingBox();

    if (!itemBox) {
      throw new Error("home grid item must be visible before width assertions");
    }

    expect(Math.abs(itemBox.width - referenceWidth)).toBeLessThanOrEqual(2);
  }

  if (count === 1) {
    expect(firstItemBox.width).toBeLessThan(gridBox.width - 16);
  }
}

async function expectMobileHomeGridFullWidth(page: Page, gridSelector: string, itemSelector: string) {
  const grid = page.locator(gridSelector);
  const items = page.locator(`${gridSelector} > ${itemSelector}`);

  if (await items.count() === 0) {
    return;
  }

  const gridBox = await grid.boundingBox();
  const firstItemBox = await items.first().boundingBox();

  if (!gridBox || !firstItemBox) {
    throw new Error("home grid and first item must be visible before mobile width assertions");
  }

  expect(Math.abs(firstItemBox.x - gridBox.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstItemBox.width - gridBox.width)).toBeLessThanOrEqual(2);
}

async function expectTwoColumnHomeGrid(page: Page, gridSelector: string, itemSelector: string) {
  const grid = page.locator(gridSelector);
  const items = page.locator(`${gridSelector} > ${itemSelector}`);

  if (await items.count() < 2) {
    return;
  }

  const gridBox = await grid.boundingBox();
  const firstItemBox = await items.first().boundingBox();
  const secondItemBox = await items.nth(1).boundingBox();

  if (!gridBox || !firstItemBox || !secondItemBox) {
    throw new Error("home grid and first two items must be visible before two-column assertions");
  }

  expect(Math.abs(firstItemBox.x - gridBox.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstItemBox.y - secondItemBox.y)).toBeLessThanOrEqual(2);
  expect(Math.abs(firstItemBox.width - secondItemBox.width)).toBeLessThanOrEqual(2);
  expect(Math.abs((secondItemBox.x + secondItemBox.width) - (gridBox.x + gridBox.width))).toBeLessThanOrEqual(2);
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

    await expectMobileHomeGridFullWidth(page, ".latest-articles-grid", ".article-card");
    await expectMobileHomeGridFullWidth(page, ".latest-releases-grid", ".release-card");
    await expectMobileHomeGridFullWidth(page, ".latest-games-grid", ".game-card");

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

test.describe("home activity grids", () => {
  test("use full-width cards when the container can only fit one column", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.setViewportSize({ width: 700, height: 900 });
    await page.goto("/");

    await expectMobileHomeGridFullWidth(page, ".latest-articles-grid", ".article-card");
    await expectMobileHomeGridFullWidth(page, ".latest-releases-grid", ".release-card");
    await expectMobileHomeGridFullWidth(page, ".latest-games-grid", ".game-card");
  });

  test("use two equal columns before expanding to three columns", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/");

    await expectTwoColumnHomeGrid(page, ".latest-articles-grid", ".article-card");
    await expectTwoColumnHomeGrid(page, ".latest-releases-grid", ".release-card");
    await expectTwoColumnHomeGrid(page, ".latest-games-grid", ".game-card");
  });

  test("keep card widths uniform and packed from the left on desktop", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocale(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    await expectUniformHomeGrid(page, ".latest-articles-grid", ".article-card");
    await expectUniformHomeGrid(page, ".latest-releases-grid", ".release-card");
    await expectUniformHomeGrid(page, ".latest-games-grid", ".game-card");
  });
});
