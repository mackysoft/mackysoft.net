import { expect, test } from "@playwright/test";

test.describe("about page", () => {
  test("renders the profile and focused links", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/about/");

    await expect(page).toHaveTitle("About | Hiroya Aramaki（荒牧裕也）/ Makihiro | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / About", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
    await expect(main.getByRole("img", { name: "Makihiro のアイコン" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Twitter を開く" })).toHaveAttribute("href", "https://twitter.com/makihiro_dev");
    await expect(main.locator(".profile-name")).toContainText("Makihiro");
    await expect(main.getByRole("heading", { level: 2, name: "何をしている人か" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "主な領域と関心" })).toBeVisible();
    expect(await main.locator(".interest-list li").count()).toBeGreaterThan(0);
    await expect(main.getByRole("heading", { level: 2, name: "このサイトで見られるもの" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Games" })).toHaveAttribute("href", "/games/");
    await expect(main.getByRole("link", { name: "Assets" })).toHaveAttribute("href", "/assets/");
    await expect(main.getByRole("link", { name: "Articles" })).toHaveAttribute("href", "/articles/");
    await expect(main.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute("href", "/contact/");
    await expect(main.getByRole("heading", { level: 2, name: "リンク" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "仕事・問い合わせ" })).toBeVisible();
    await expect(main.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/mackysoft");
    await expect(main.getByRole("link", { name: "Twitter", exact: true })).toHaveAttribute("href", "https://twitter.com/makihiro_dev");
    await expect(main.getByRole("link", { name: "Zenn" })).toHaveAttribute("href", "https://zenn.dev/makihiro_dev");
    await expect(main.getByRole("link", { name: "YouTube" })).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Contact を開く" })).toHaveAttribute("href", "/contact/");
  });
});
