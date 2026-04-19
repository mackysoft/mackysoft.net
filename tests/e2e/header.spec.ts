import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const translatedVisionTitle = "[Unity] Implementing CullingGroup More Easily [Vision]";
const scrollRestoreStorageKey = "mackysoft-locale-scroll";
const scrollRestoreCaptureKey = "__testScrollRestoreCapture__";

async function installScrollToRecorder(page: Page) {
  await page.addInitScript(() => {
    const scrollCalls: number[] = [];
    const originalScrollTo = window.scrollTo.bind(window);

    Object.defineProperty(window, "__testScrollToCalls", {
      configurable: true,
      value: scrollCalls,
      writable: true,
    });

    window.scrollTo = ((optionsOrX?: ScrollToOptions | number, y?: number) => {
      let nextTop = window.scrollY;

      if (typeof optionsOrX === "object" && optionsOrX !== null) {
        const top = optionsOrX.top;
        nextTop = typeof top === "number" ? top : nextTop;
      } else if (typeof y === "number") {
        nextTop = y;
      }

      scrollCalls.push(nextTop);

      if (typeof optionsOrX === "object" && optionsOrX !== null) {
        return originalScrollTo(optionsOrX);
      }

      return originalScrollTo(
        typeof optionsOrX === "number" ? optionsOrX : window.scrollX,
        typeof y === "number" ? y : window.scrollY,
      );
    }) as typeof window.scrollTo;
  });
}

async function installScrollRestoreWriteRecorder(page: Page) {
  await page.addInitScript(({ captureKey, storageKey }) => {
    const recorderReadyKey = "__testScrollRestoreRecorderReady__";

    if (!window.sessionStorage.getItem(recorderReadyKey)) {
      window.localStorage.removeItem(captureKey);
      window.sessionStorage.setItem(recorderReadyKey, "true");
    }

    const storagePrototype = Object.getPrototypeOf(window.sessionStorage) as Storage;
    const originalSetItem = storagePrototype.setItem;

    storagePrototype.setItem = function setItem(key: string, value: string) {
      if (this === window.sessionStorage && key === storageKey) {
        window.localStorage.setItem(captureKey, value);
      }

      return originalSetItem.call(this, key, value);
    };
  }, {
    captureKey: scrollRestoreCaptureKey,
    storageKey: scrollRestoreStorageKey,
  });
}

async function getRecordedScrollRestoreWrite(page: Page) {
  return page.evaluate((captureKey) => {
    const rawValue = window.localStorage.getItem(captureKey);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as {
      pathname?: unknown;
      progress?: unknown;
      timestamp?: unknown;
    };
  }, scrollRestoreCaptureKey);
}

async function getRecordedScrollToCalls(page: Page) {
  return page.evaluate(() => {
    const testWindow = window as Window & typeof globalThis & {
      __testScrollToCalls?: number[];
    };

    return [...(testWindow.__testScrollToCalls ?? [])];
  });
}

async function waitForRestoredScrollCall(page: Page, expectedProgress: number) {
  await page.waitForFunction((progress) => {
    const testWindow = window as Window & typeof globalThis & {
      __testScrollToCalls?: number[];
    };
    const calls = testWindow.__testScrollToCalls ?? [];
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0);
    const maxScroll = Math.max(documentHeight - window.innerHeight, 0);
    const expectedTop = Math.max(Math.min(Math.round(maxScroll * progress), maxScroll), 0);
    const tolerance = Math.max(48, Math.round(maxScroll * 0.08));

    return calls.some((top) => Math.abs(top - expectedTop) <= tolerance);
  }, expectedProgress);
}

async function seedScrollRestoreState(page: Page, pathname: string, progress: number) {
  await page.addInitScript(({ nextPathname, nextProgress }) => {
    window.sessionStorage.setItem("mackysoft-locale-scroll", JSON.stringify({
      pathname: nextPathname,
      progress: nextProgress,
      timestamp: Date.now(),
    }));
  }, {
    nextPathname: pathname,
    nextProgress: progress,
  });
}

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
    await expect(languageTool).toContainText("JA");
    await expect(languageToggle).toHaveAttribute("aria-label", "表示言語を切り替え");

    await languageToggle.click();

    await expect(languageTool).toHaveAttribute("open", "");
    await expect(languageTool.getByRole("menuitemradio", { name: "日本語" })).toBeVisible();
    await expect(languageTool.getByRole("menuitemradio", { name: "English" })).toBeVisible();
    await expect(languageTool.getByRole("menuitemradio", { name: "繁體中文" })).toBeVisible();
    await expect(languageTool.getByRole("menuitemradio", { name: "한국어" })).toBeVisible();
    await expect(languageTool.locator(".site-language-menu__popover")).toHaveCSS("background-color", "rgb(220, 239, 255)");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "プライバシーポリシー", exact: true })).toHaveAttribute(
      "href",
      "/privacy-policy/",
    );

    const brandBox = await brand.boundingBox();
    const toolsBox = await tools.boundingBox();
    const navBox = await nav.boundingBox();
    const languageBox = await languageTool.boundingBox();
    const themeBox = await themeTool.boundingBox();
    const searchBox = await searchTool.boundingBox();

    if (!brandBox || !toolsBox || !navBox || !languageBox || !themeBox || !searchBox) {
      throw new Error("header elements must be visible before layout assertions");
    }

    expect(navBox.x).toBeGreaterThan(brandBox.x + brandBox.width - 1);
    expect(toolsBox.x).toBeGreaterThanOrEqual(navBox.x + navBox.width - 1);
    expect(languageBox.x).toBeGreaterThanOrEqual(themeBox.x + themeBox.width - 1);
    expect(searchBox.x).toBeGreaterThanOrEqual(languageBox.x + languageBox.width - 1);
    expect(Math.abs(languageBox.y - themeBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(searchBox.y - themeBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(languageBox.height - themeBox.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(searchBox.height - themeBox.height)).toBeLessThanOrEqual(1);
  });

  test("keeps the language button width stable across locales", { tag: "@size:medium" }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    const widths: number[] = [];

    for (const path of ["/", "/en/", "/zh-hant/", "/ko/"]) {
      await page.goto(path);
      const box = await page.locator("[data-site-language-toggle]").boundingBox();

      if (!box) {
        throw new Error("language toggle must be visible before width assertions");
      }

      widths.push(box.width);
    }

    const referenceWidth = widths[0]!;

    for (const width of widths.slice(1)) {
      expect(Math.abs(width - referenceWidth)).toBeLessThanOrEqual(1);
    }
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
    const searchTool = tools.locator('[data-site-tool="search"]');

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(nav).toBeHidden();
    await expect(menuToggle).toBeVisible();
    await expect(searchTool).toHaveAttribute("href", "/search/");
    await expect(tools.locator('[data-site-tool="theme"]')).toBeEnabled();
    await expect(tools.locator('[data-site-tool="language"]')).toContainText("JA");

    await menuToggle.click();

    await expect(mobileMenu).toHaveAttribute("open", "");
    await expect(mobileMenu.getByRole("link", { name: "プロフィール", exact: true })).toHaveAttribute("href", "/about/");
    await expect(mobileMenu.getByRole("link", { name: "ゲーム", exact: true })).toHaveAttribute("href", "/games/");
    await expect(mobileMenu.getByRole("link", { name: "アセット", exact: true })).toHaveAttribute("href", "/assets/");
    await expect(mobileMenu.getByRole("link", { name: "記事", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(mobileMenu.getByRole("link", { name: "問い合わせ", exact: true })).toHaveAttribute("href", "/contact/");

    const aboutLinkBox = await mobileMenu.getByRole("link", { name: "プロフィール", exact: true }).boundingBox();
    const gamesLinkBox = await mobileMenu.getByRole("link", { name: "ゲーム", exact: true }).boundingBox();
    const languageBox = await tools.locator('[data-site-tool="language"]').boundingBox();
    const themeBox = await tools.locator('[data-site-tool="theme"]').boundingBox();

    if (!aboutLinkBox || !gamesLinkBox || !languageBox || !themeBox) {
      throw new Error("mobile navigation links and tools must be visible before layout assertions");
    }

    expect(gamesLinkBox.y).toBeGreaterThanOrEqual(aboutLinkBox.y + aboutLinkBox.height - 1);

    const searchBox = await searchTool.boundingBox();
    const menuBox = await menuToggle.boundingBox();

    if (!searchBox || !menuBox) {
      throw new Error("search and menu tools must be visible before alignment assertions");
    }

    expect(Math.abs(searchBox.y - menuBox.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(searchBox.height - menuBox.height)).toBeLessThanOrEqual(1);

    const themeLanguageGap = languageBox.x - (themeBox.x + themeBox.width);
    const languageSearchGap = searchBox.x - (languageBox.x + languageBox.width);
    const searchMenuGap = menuBox.x - (searchBox.x + searchBox.width);

    expect(Math.abs(themeLanguageGap - languageSearchGap)).toBeLessThanOrEqual(1);
    expect(Math.abs(languageSearchGap - searchMenuGap)).toBeLessThanOrEqual(1);

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

  test("shows the primary nav again on tablet widths", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 800, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/");

    const header = page.locator(".site-header");
    const nav = header.locator(".site-header__nav");
    const menuToggle = header.locator('[data-site-tool="menu"]');

    await expect(nav).toBeVisible();
    await expect(menuToggle).toBeHidden();
    await expect(nav.getByRole("link", { name: "プロフィール", exact: true })).toHaveAttribute("href", "/about/");

    await context.close();
  });

  test("keeps the mobile menu below the desktop nav breakpoint", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 799, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/");

    const header = page.locator(".site-header");
    const nav = header.locator(".site-header__nav");
    const menuToggle = header.locator('[data-site-tool="menu"]');

    await expect(nav).toBeHidden();
    await expect(menuToggle).toBeVisible();

    await context.close();
  });

  test("keeps the header nav on a single row when it is visible", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 800, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "ja");
    });
    const page = await context.newPage();

    await page.goto("/");

    const linkBoxes = await page.locator(".site-header__nav .site-nav a").evaluateAll((elements) =>
      elements.map((element) => {
        const { y, height } = element.getBoundingClientRect();
        return { y, height };
      })
    );

    if (linkBoxes.length === 0) {
      throw new Error("header nav links must be visible before row assertions");
    }

    const firstRowTop = linkBoxes[0]!.y;

    for (const { y, height } of linkBoxes) {
      expect(Math.abs(y - firstRowTop)).toBeLessThanOrEqual(1);
      expect(height).toBeGreaterThan(0);
    }

    await context.close();
  });

  test("keeps the brand visible when the compact tools still fit", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "zh-hant");
    });
    const page = await context.newPage();

    await page.goto("/zh-hant/search/");

    const brand = page.locator(".site-brand");
    const tools = page.locator("[data-site-header-tools]");
    const menuToggle = page.locator('[data-site-tool="menu"]');

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(menuToggle).toBeVisible();

    const brandBox = await brand.boundingBox();
    const toolsBox = await tools.boundingBox();
    const menuBox = await menuToggle.boundingBox();

    if (!brandBox || !toolsBox || !menuBox) {
      throw new Error("brand, header tools, and menu must be visible before layout assertions");
    }

    expect(toolsBox.x).toBeGreaterThanOrEqual(brandBox.x + brandBox.width - 1);
    expect(menuBox.x).toBeGreaterThanOrEqual(toolsBox.x + toolsBox.width - 1);

    await context.close();
  });

  test("hides the brand on extremely narrow screens to keep header tools visible", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 300, height: 812 }, colorScheme: "light" });
    await context.addInitScript(() => {
      window.localStorage.setItem("mackysoft-locale", "zh-hant");
    });
    const page = await context.newPage();

    await page.goto("/zh-hant/search/");

    const brand = page.locator(".site-brand");
    const tools = page.locator("[data-site-header-tools]");
    const menuToggle = page.locator('[data-site-tool="menu"]');

    await expect(brand).toBeHidden();
    await expect(tools).toBeVisible();
    await expect(menuToggle).toBeVisible();

    const toolsBox = await tools.boundingBox();
    const menuBox = await menuToggle.boundingBox();

    if (!toolsBox || !menuBox) {
      throw new Error("header tools and menu must be visible before layout assertions");
    }

    expect(toolsBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.x).toBeGreaterThanOrEqual(toolsBox.x + toolsBox.width - 1);

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

  test("persists scroll progress when switching article detail routes through the language menu", { tag: "@size:medium" }, async ({ page }) => {
    await installScrollRestoreWriteRecorder(page);
    await page.goto("/articles/how-to-complete-game-development/");

    const beforeNavigation = await scrollToProgress(page, 0.48);
    expect(beforeNavigation.maxScroll).toBeGreaterThan(1000);

    await page.locator("[data-site-language-toggle]").click();
    await page.getByRole("menuitemradio", { name: "English" }).click();

    await expect(page).toHaveURL("/en/articles/how-to-complete-game-development/");
    await expect(page.locator(".article-fallback-notice")).toHaveCount(0);
    const recordedState = await getRecordedScrollRestoreWrite(page);

    expect(recordedState).not.toBeNull();
    expect(recordedState?.pathname).toBe("/en/articles/how-to-complete-game-development/");
    expect(typeof recordedState?.progress).toBe("number");
    expect(recordedState?.progress as number).toBeGreaterThan(0.25);
    expect(recordedState?.progress as number).toBeLessThan(0.75);
  });

  test("stops restoring scroll progress after the reader scrolls on translated article routes", { tag: "@size:medium" }, async ({ page }) => {
    await installScrollToRecorder(page);
    await seedScrollRestoreState(page, "/en/articles/how-to-complete-game-development/", 0.48);
    await page.goto("/en/articles/how-to-complete-game-development/");
    await expect(page).toHaveURL("/en/articles/how-to-complete-game-development/");
    await expect(page.locator(".article-fallback-notice")).toHaveCount(0);
    await page.waitForLoadState("load");
    await waitForRestoredScrollCall(page, 0.48);

    const restored = await getScrollMetrics(page);

    await page.evaluate(() => {
      window.dispatchEvent(new WheelEvent("wheel", { deltaY: -480 }));
      window.scrollBy({ left: 0, top: -480, behavior: "auto" });
    });

    await page.waitForFunction((previousScrollY) => {
      return window.scrollY <= Math.max(previousScrollY - 200, 0);
    }, restored.scrollY);

    const manualScroll = await getScrollMetrics(page);
    const scrollCallsAfterManualScroll = await getRecordedScrollToCalls(page);

    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.dataset.testScrollRestoreSpacer = "true";
      spacer.style.height = "1200px";
      document.body.append(spacer);
    });

    await page.waitForTimeout(200);

    const afterResize = await getScrollMetrics(page);
    const scrollCallsAfterResize = await getRecordedScrollToCalls(page);

    expect(Math.abs(afterResize.scrollY - manualScroll.scrollY)).toBeLessThanOrEqual(2);
    expect(afterResize.scrollY).toBeLessThan(restored.scrollY - 200);
    expect(scrollCallsAfterResize).toHaveLength(scrollCallsAfterManualScroll.length);
  });

  test("stops restoring scroll progress after the reader scrolls with the keyboard on translated article routes", { tag: "@size:medium" }, async ({ page }) => {
    await installScrollToRecorder(page);
    await seedScrollRestoreState(page, "/en/articles/how-to-complete-game-development/", 0.48);
    await page.goto("/en/articles/how-to-complete-game-development/");
    await expect(page).toHaveURL("/en/articles/how-to-complete-game-development/");
    await expect(page.locator(".article-fallback-notice")).toHaveCount(0);
    await page.waitForLoadState("load");
    await waitForRestoredScrollCall(page, 0.48);

    const restored = await getScrollMetrics(page);

    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      window.scrollBy({ left: 0, top: 480, behavior: "auto" });
    });
    await page.waitForFunction((previousScrollY) => {
      return window.scrollY >= previousScrollY + 200;
    }, restored.scrollY);

    const manualScroll = await getScrollMetrics(page);
    const scrollCallsAfterManualScroll = await getRecordedScrollToCalls(page);

    await page.evaluate(() => {
      const spacer = document.createElement("div");
      spacer.dataset.testScrollRestoreKeyboardSpacer = "true";
      spacer.style.height = "1200px";
      document.body.append(spacer);
    });

    await page.waitForTimeout(200);

    const afterResize = await getScrollMetrics(page);
    const scrollCallsAfterResize = await getRecordedScrollToCalls(page);

    expect(Math.abs(afterResize.scrollY - manualScroll.scrollY)).toBeLessThanOrEqual(2);
    expect(afterResize.scrollY).toBeGreaterThan(restored.scrollY + 100);
    expect(scrollCallsAfterResize).toHaveLength(scrollCallsAfterManualScroll.length);
  });

  test("restores scroll progress when switching article index routes through the language menu", { tag: "@size:medium" }, async ({ page }) => {
    await installScrollRestoreWriteRecorder(page);
    await page.goto("/articles/");

    const beforeNavigation = await scrollToProgress(page, 0.58);
    expect(beforeNavigation.maxScroll).toBeGreaterThan(800);

    await page.locator("[data-site-language-toggle]").click();
    await page.getByRole("menuitemradio", { name: "English" }).click();

    await expect(page).toHaveURL("/en/articles/");
    await page.waitForLoadState("load");
    const recordedState = await getRecordedScrollRestoreWrite(page);
    expect(recordedState).not.toBeNull();
    expect(recordedState?.pathname).toBe("/en/articles/");
    expect(Math.abs((recordedState?.progress as number) - beforeNavigation.progress)).toBeLessThanOrEqual(0.03);
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
