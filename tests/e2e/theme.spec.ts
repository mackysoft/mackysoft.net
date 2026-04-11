import { expect, test } from "@playwright/test";

test.describe("theme toggle", () => {
  test("uses the OS preference on first visit and applies dark surfaces across representative pages", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 960 } });
    const page = await context.newPage();

    await page.goto("/");

    const html = page.locator("html");
    const themeToggle = page.locator('[data-site-tool="theme"]');

    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(themeToggle).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".content-panel").first()).toHaveCSS("background-color", "rgba(28, 32, 31, 0.82)");
    await expect(page.getByRole("link", { name: "View Articles", exact: true })).toHaveCSS(
      "background-color",
      "rgba(243, 238, 230, 0.08)",
    );

    await page.goto("/games/treasure-rogue/");

    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(page.locator(".game-screenshot-gallery__item").first()).toHaveCSS(
      "background-color",
      "rgba(243, 238, 230, 0.08)",
    );
    await expect(page.locator(".game-action-panel__button").first()).toHaveCSS("background-color", "rgb(77, 167, 86)");

    await context.close();
  });

  test("persists the explicit theme choice across reloads", { tag: "@size:medium" }, async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark", viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    await page.goto("/");

    const html = page.locator("html");
    const themeToggle = page.locator('[data-site-tool="theme"]');

    await expect(html).toHaveAttribute("data-theme", "dark");
    await expect(themeToggle).toHaveAttribute("aria-pressed", "true");

    await themeToggle.click();

    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
    expect(await page.evaluate(() => window.localStorage.getItem("mackysoft-theme"))).toBe("light");

    await page.reload();

    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(themeToggle).toHaveAttribute("aria-pressed", "false");
    expect(await page.evaluate(() => window.localStorage.getItem("mackysoft-theme"))).toBe("light");

    await context.close();
  });
});
