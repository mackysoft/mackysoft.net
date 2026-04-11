import { expect, test } from "@playwright/test";

test.describe("site header", () => {
  test("shows static header tools after navigation on desktop", { tag: "@size:medium" }, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");

    const header = page.locator(".site-header");
    const brand = header.getByRole("link", { name: "mackysoft.net", exact: true });
    const tools = header.locator("[data-site-header-tools]");
    const nav = header.locator(".site-header__nav");
    const searchTool = tools.locator('[data-site-tool="search"]');
    const themeTool = tools.locator('[data-site-tool="theme"]');
    const languageTool = tools.locator('[data-site-tool="language"]');

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(nav).toBeVisible();
    await expect(searchTool).toBeVisible();
    await expect(searchTool).toBeDisabled();
    await expect(themeTool.locator("svg")).toHaveCount(2);
    await expect(themeTool).toBeEnabled();
    await expect(themeTool).toHaveAttribute("aria-label", "テーマを切り替え");
    await expect(themeTool).toHaveAttribute("aria-pressed", "false");
    await expect(languageTool).toContainText("JP");
    await expect(languageTool).toBeDisabled();

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
    const page = await context.newPage();

    await page.goto("/");

    const header = page.locator(".site-header");
    const brand = header.getByRole("link", { name: "mackysoft.net", exact: true });
    const tools = header.locator("[data-site-header-tools]");
    const nav = header.locator(".site-header__nav");

    await expect(brand).toBeVisible();
    await expect(tools).toBeVisible();
    await expect(nav).toBeVisible();
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
});
