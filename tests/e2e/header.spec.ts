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
  const targetScrollTop = await page.evaluate((targetProgress) => {
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const maxScroll = Math.max(documentHeight - window.innerHeight, 0);
    const nextScrollTop = Math.max(Math.min(Math.round(maxScroll * targetProgress), maxScroll), 0);

    window.scrollTo(0, nextScrollTop);
    return nextScrollTop;
  }, progress);

  await page.waitForFunction((expectedScrollTop) => Math.abs(window.scrollY - expectedScrollTop) <= 2, targetScrollTop);

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
    const menuToggle = header.locator('[data-site-tool="menu"]');
    const searchTool = tools.locator('[data-site-tool="search"]');
    const themeTool = tools.locator('[data-site-tool="theme"]');
    const languageTool = tools.locator('[data-site-tool="language"]');
    const languageToggle = tools.locator("[data-site-language-toggle]");

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(menuToggle).toBeHidden();
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
    await expect(languageTool.getByRole("menuitemradio", { name: "繁體中文" })).toBeVisible();
    await expect(languageTool.locator(".site-language-menu__popover")).toHaveCSS("background-color", "rgb(220, 239, 255)");
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

  test("hides the primary nav behind the mobile menu on narrow screens", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/articles/");

    const header = page.locator(".site-header");
    const brand = header.getByRole("link", { name: "mackysoft.net", exact: true });
    const tools = header.locator("[data-site-header-tools]");
    const nav = header.locator(".site-header__nav");
    const mobileMenu = header.locator("[data-site-mobile-nav]");
    const menuToggle = header.locator('[data-site-tool="menu"]');

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(nav).toBeHidden();
    await expect(menuToggle).toBeVisible();
    await expect(tools.locator('[data-site-tool="search"]')).toHaveAttribute("href", "/search/");
    await expect(tools.locator('[data-site-tool="theme"]')).toBeEnabled();
    await expect(tools.locator('[data-site-tool="language"]')).toContainText("JP");

    await menuToggle.click();

    await expect(mobileMenu).toHaveAttribute("open", "");
    await expect(mobileMenu.getByRole("link", { name: "プロフィール", exact: true })).toHaveAttribute("href", "/about/");
    await expect(mobileMenu.getByRole("link", { name: "ゲーム", exact: true })).toHaveAttribute("href", "/games/");
    await expect(mobileMenu.getByRole("link", { name: "アセット", exact: true })).toHaveAttribute("href", "/assets/");
    await expect(mobileMenu.getByRole("link", { name: "記事", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(mobileMenu.getByRole("link", { name: "問い合わせ", exact: true })).toHaveAttribute("href", "/contact/");

    const aboutLinkBox = await mobileMenu.getByRole("link", { name: "プロフィール", exact: true }).boundingBox();
    const gamesLinkBox = await mobileMenu.getByRole("link", { name: "ゲーム", exact: true }).boundingBox();

    if (!aboutLinkBox || !gamesLinkBox) {
      throw new Error("mobile navigation links must be visible before vertical layout assertions");
    }

    expect(gamesLinkBox.y).toBeGreaterThanOrEqual(aboutLinkBox.y + aboutLinkBox.height - 1);

    await page.keyboard.press("Escape");
    await expect(mobileMenu).not.toHaveAttribute("open", "");

    await menuToggle.click();
    await expect(mobileMenu).toHaveAttribute("open", "");
    const panelBox = await mobileMenu.locator(".site-mobile-nav__panel").boundingBox();

    if (!panelBox) {
      throw new Error("mobile menu panel must be visible before outside-click assertions");
    }

    await page.mouse.click(panelBox.x + 12, panelBox.y + panelBox.height + 24);
    await expect(mobileMenu).not.toHaveAttribute("open", "");

    await context.close();
  });

  test("closes the mobile menu after same-tab navigation on narrow screens", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/");

    const mobileMenu = page.locator("[data-site-mobile-nav]");
    const menuToggle = page.locator('[data-site-tool="menu"]');

    await menuToggle.click();
    await expect(mobileMenu).toHaveAttribute("open", "");

    await mobileMenu.getByRole("link", { name: "ゲーム", exact: true }).click();

    await expect(page).toHaveURL("/games/");
    await expect(mobileMenu).not.toHaveAttribute("open", "");

    await context.close();
  });

  test("keeps the mobile menu usable when JavaScript is unavailable", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();

    await page.goto("/");

    const mobileMenu = page.locator("[data-site-mobile-nav]");
    const menuToggle = page.locator('[data-site-tool="menu"]');

    await expect(mobileMenu).not.toHaveAttribute("open", "");
    await expect(menuToggle).not.toHaveAttribute("aria-expanded", "false");
    await menuToggle.click();
    await expect(mobileMenu).toHaveAttribute("open", "");
    await expect(menuToggle).not.toHaveAttribute("aria-expanded", "false");
    await expect(mobileMenu.getByRole("link", { name: "プロフィール", exact: true })).toBeVisible();

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

  test("stops restoring scroll progress after the reader scrolls on translated article routes", { tag: "@size:medium" }, async ({ page }) => {
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

    const restored = await getScrollMetrics(page);

    await page.evaluate(() => {
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: -480 }));
      window.scrollBy({ left: 0, top: -480, behavior: "auto" });
    });

    await page.waitForFunction((previousScrollY) => {
      return window.scrollY <= Math.max(previousScrollY - 200, 0);
    }, restored.scrollY);

    const manualScroll = await getScrollMetrics(page);

    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.dataset.testScrollRestoreSpacer = "true";
      spacer.style.height = "1200px";
      document.body.append(spacer);
    });

    await page.waitForTimeout(200);

    const afterResize = await getScrollMetrics(page);

    expect(Math.abs(afterResize.scrollY - manualScroll.scrollY)).toBeLessThanOrEqual(2);
    expect(afterResize.scrollY).toBeLessThan(restored.scrollY - 200);
  });

  test("stops restoring scroll progress after the reader scrolls with the keyboard on translated article routes", { tag: "@size:medium" }, async ({ page }) => {
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

    const restored = await getScrollMetrics(page);

    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      window.scrollBy({ left: 0, top: 480, behavior: "auto" });
    });
    await page.waitForFunction((previousScrollY) => {
      return window.scrollY >= previousScrollY + 200;
    }, restored.scrollY);

    const manualScroll = await getScrollMetrics(page);

    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.dataset.testScrollRestoreKeyboardSpacer = "true";
      spacer.style.height = "1200px";
      document.body.append(spacer);
    });

    await page.waitForTimeout(200);

    const afterResize = await getScrollMetrics(page);

    expect(Math.abs(afterResize.scrollY - manualScroll.scrollY)).toBeLessThanOrEqual(2);
    expect(afterResize.scrollY).toBeGreaterThan(restored.scrollY + 100);
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
    await expect(selectedItem).toHaveCSS("background-color", "rgba(31, 146, 213, 0.14)");
    await expect(selectedItem).toHaveCSS("color", "rgb(31, 146, 213)");
    expect(await selectedItem.evaluate((element) => getComputedStyle(element, "::after").content)).toBe('"✓"');
    expect(await selectedItem.evaluate((element) => getComputedStyle(element, "::after").color)).toBe("rgb(31, 146, 213)");
  });
});
