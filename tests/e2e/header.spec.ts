import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const translatedVisionTitle = "[Unity] Implementing CullingGroup More Easily [Vision]";

async function getScrollMetrics(page: Page) {
  return page.evaluate(() => {
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const maxScroll = Math.max(documentHeight - window.innerHeight, 0);

    return {
      scrollY: window.scrollY,
      maxScroll,
      progress: maxScroll === 0 ? 0 : window.scrollY / maxScroll,
    };
  });
}

async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate((targetProgress) => {
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const maxScroll = Math.max(documentHeight - window.innerHeight, 0);
    const nextScrollTop = Math.max(Math.min(Math.round(maxScroll * targetProgress), maxScroll), 0);

    window.scrollTo(0, nextScrollTop);
  }, progress);

  await page.waitForFunction((targetProgress) => {
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const maxScroll = Math.max(documentHeight - window.innerHeight, 0);
    const expectedScrollTop = Math.max(Math.min(Math.round(maxScroll * targetProgress), maxScroll), 0);

    return Math.abs(window.scrollY - expectedScrollTop) <= 2;
  }, progress);

  return getScrollMetrics(page);
}

test.describe("site header", () => {
  test("shows static header tools after navigation on desktop", { tag: "@size:medium" }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    await page.goto("/");

    const header = page.locator(".site-header");
    const brand = header.getByRole("link", { name: "mackysoft.net", exact: true });
    const tools = header.locator("[data-site-header-tools]");
    const nav = header.locator(".site-header__nav");
    const searchTool = tools.locator('[data-site-tool="search"]');
    const themeTool = tools.locator('[data-site-tool="theme"]');
    const languageTool = tools.locator('[data-site-tool="language"]');
    const languageToggle = tools.locator("[data-site-language-toggle]");

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "プロフィール", exact: true })).toHaveAttribute("href", "/about/");
    await expect(nav.getByRole("link", { name: "ゲーム", exact: true })).toHaveAttribute("href", "/games/");
    await expect(nav.getByRole("link", { name: "アセット", exact: true })).toHaveAttribute("href", "/assets/");
    await expect(nav.getByRole("link", { name: "記事", exact: true })).toHaveAttribute("href", "/articles/");
    await expect(nav.getByRole("link", { name: "問い合わせ", exact: true })).toHaveAttribute("href", "/contact/");
    await expect(searchTool).toBeVisible();
    await expect(searchTool).toHaveAttribute("href", "/search/");
    await expect(searchTool).toHaveAttribute("aria-label", "検索を開く");
    await expect(themeTool.locator("svg")).toHaveCount(2);
    await expect(themeTool).toBeEnabled();
    await expect(themeTool).toHaveAttribute("aria-label", "テーマを切り替え");
    await expect(themeTool).toHaveAttribute("aria-pressed", "false");
    await expect(languageTool).toContainText("JP");
    await expect(languageToggle).toHaveAttribute("aria-label", "表示言語を切り替え");

    await languageToggle.click();

    await expect(languageTool).toHaveAttribute("open", "");
    await expect(languageTool.getByRole("menuitemradio", { name: "日本語" })).toBeVisible();
    await expect(languageTool.getByRole("menuitemradio", { name: "English" })).toBeVisible();
    await expect(languageTool.locator(".site-language-menu__popover")).toHaveCSS("background-color", "rgb(236, 229, 216)");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "プライバシーポリシー", exact: true })).toHaveAttribute(
      "href",
      "/privacy-policy/",
    );

    const brandBox = await brand.boundingBox();
    const toolsBox = await tools.boundingBox();
    const navBox = await nav.boundingBox();

    if (!brandBox || !toolsBox || !navBox) {
      throw new Error("header elements must be visible before layout assertions");
    }

    expect(navBox.x).toBeGreaterThan(brandBox.x + brandBox.width - 1);
    expect(toolsBox.x).toBeGreaterThanOrEqual(navBox.x + navBox.width - 1);
  });

  test("stacks header tools after navigation on narrow screens", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/");

    const header = page.locator(".site-header");
    const brand = header.getByRole("link", { name: "mackysoft.net", exact: true });
    const tools = header.locator("[data-site-header-tools]");
    const nav = header.locator(".site-header__nav");

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(tools.locator('[data-site-tool="search"]')).toHaveAttribute("href", "/search/");
    await expect(tools.locator('[data-site-tool="theme"]')).toBeEnabled();

    const headerBox = await header.boundingBox();
    const brandBox = await brand.boundingBox();
    const toolsBox = await tools.boundingBox();
    const navBox = await nav.boundingBox();

    if (!headerBox || !brandBox || !toolsBox || !navBox) {
      throw new Error("header elements must be visible before layout assertions");
    }

    expect(brandBox.y + brandBox.height).toBeLessThanOrEqual(navBox.y + 4);
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(toolsBox.y + 4);
    expect(toolsBox.x + toolsBox.width).toBeLessThanOrEqual(headerBox.x + headerBox.width + 1);
    expect(navBox.x + navBox.width).toBeLessThanOrEqual(headerBox.x + headerBox.width + 1);

    await context.close();
  });

  test("keeps the theme toggle disabled when JavaScript is unavailable", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: "dark",
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page.locator('[data-site-tool="theme"]')).toBeDisabled();

    await context.close();
  });

  test("switches article detail routes through the language menu and stores the choice", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/vision-introduction/");

    const languageToggle = page.locator("[data-site-language-toggle]");

    await languageToggle.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-site-tool="language"]')).toHaveAttribute("open", "");

    await page.getByRole("menuitemradio", { name: "English" }).click();

    await expect(page).toHaveURL("/en/articles/vision-introduction/");
    await expect(page.locator(".article-fallback-notice")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: translatedVisionTitle })).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem("mackysoft-locale"))).toBe("en");
  });

  test("restores scroll progress when switching article detail routes through the language menu", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/how-to-complete-game-development/");

    const beforeNavigation = await scrollToProgress(page, 0.48);
    expect(beforeNavigation.maxScroll).toBeGreaterThan(1000);

    await page.locator("[data-site-language-toggle]").click();
    await page.getByRole("menuitemradio", { name: "English" }).click();

    await expect(page).toHaveURL("/en/articles/how-to-complete-game-development/");
    await expect(page.locator(".article-fallback-notice")).toHaveCount(0);
    await page.waitForLoadState("load");
    await page.waitForFunction((expectedProgress) => {
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
      const maxScroll = Math.max(documentHeight - window.innerHeight, 0);
      const progress = maxScroll === 0 ? 0 : window.scrollY / maxScroll;

      return Math.abs(progress - expectedProgress) <= 0.08;
    }, beforeNavigation.progress);

    const afterNavigation = await getScrollMetrics(page);

    expect(afterNavigation.scrollY).toBeGreaterThan(200);
    expect(Math.abs(afterNavigation.progress - beforeNavigation.progress)).toBeLessThanOrEqual(0.08);
  });

  test("restores scroll progress when switching article index routes through the language menu", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/");

    const beforeNavigation = await scrollToProgress(page, 0.58);
    expect(beforeNavigation.maxScroll).toBeGreaterThan(800);

    await page.locator("[data-site-language-toggle]").click();
    await page.getByRole("menuitemradio", { name: "English" }).click();

    await expect(page).toHaveURL("/en/articles/");
    await page.waitForLoadState("load");
    await page.waitForFunction((expectedProgress) => {
      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
      const maxScroll = Math.max(documentHeight - window.innerHeight, 0);
      const progress = maxScroll === 0 ? 0 : window.scrollY / maxScroll;

      return Math.abs(progress - expectedProgress) <= 0.12;
    }, beforeNavigation.progress);

    const afterNavigation = await getScrollMetrics(page);

    expect(afterNavigation.scrollY).toBeGreaterThan(200);
    expect(Math.abs(afterNavigation.progress - beforeNavigation.progress)).toBeLessThanOrEqual(0.12);
  });

  test("shows the translated article locale as both selected and current", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/articles/vision-introduction/");

    await page.locator("[data-site-language-toggle]").click();

    const currentContentItem = page.locator(".site-language-menu__item--current-content");
    const selectedItem = page.locator('.site-language-menu__item--current[aria-checked="true"]');

    await expect(currentContentItem).toHaveCount(0);
    await expect(selectedItem).toHaveText("English");
    await expect(selectedItem).toHaveCSS("background-color", "rgba(14, 107, 99, 0.1)");
    await expect(selectedItem).toHaveCSS("color", "rgb(14, 107, 99)");
    expect(await selectedItem.evaluate((element) => getComputedStyle(element, "::after").content)).toBe('"✓"');
    expect(await selectedItem.evaluate((element) => getComputedStyle(element, "::after").color)).toBe("rgb(14, 107, 99)");
  });
});
