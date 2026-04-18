import { expect, test } from "@playwright/test";

test.describe("about page", () => {
  test("renders the profile and focused links", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/about/");

    await expect(page).toHaveTitle("プロフィール | Hiroya Aramaki（荒牧裕也）/ Makihiro | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / About", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "プロフィール" })).toBeVisible();
    await expect(main.getByRole("img", { name: "Makihiro のアイコン" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Twitter を開く" })).toHaveAttribute("href", "https://twitter.com/makihiro_dev");
    await expect(main.locator(".profile-name")).toContainText("Makihiro");
    await expect(main.getByRole("heading", { level: 2, name: "何をしている人か" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "主な領域と関心" })).toBeVisible();
    expect(await main.locator(".interest-list li").count()).toBeGreaterThan(0);
    await expect(main.getByRole("heading", { level: 2, name: "このサイトで見られるもの" })).toBeVisible();
    const siteGuide = main.locator(".about-section").filter({ hasText: "このサイトで見られるもの" });
    await expect(siteGuide.getByRole("link", { name: "ゲーム" })).toHaveAttribute("href", "/games/");
    await expect(siteGuide.getByRole("link", { name: "アセット" })).toHaveAttribute("href", "/assets/");
    await expect(siteGuide.getByRole("link", { name: "記事" })).toHaveAttribute("href", "/articles/");
    await expect(siteGuide.getByRole("link", { name: "問い合わせ", exact: true })).toHaveAttribute("href", "/contact/");
    await expect(main.getByRole("heading", { level: 2, name: "外部リンク" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "仕事・問い合わせ" })).toBeVisible();
    await expect(main.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/mackysoft");
    await expect(main.getByRole("link", { name: "Twitter", exact: true })).toHaveAttribute("href", "https://twitter.com/makihiro_dev");
    await expect(main.getByRole("link", { name: "Zenn" })).toHaveAttribute("href", "https://zenn.dev/makihiro_dev");
    await expect(main.getByRole("link", { name: "YouTube" })).toHaveCount(0);
    await expect(main.locator(".section-grid").getByRole("link", { name: "問い合わせ先を見る", exact: true })).toHaveAttribute("href", "/contact/");
  });

  test("renders the zh-hant about page", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/zh-hant/about/");

    await expect(page).toHaveTitle("個人簡介 | Hiroya Aramaki / Makihiro | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / About", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "個人簡介" })).toBeVisible();
    await expect(main.getByRole("img", { name: "Makihiro 頭像" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "我在做什麼" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "主要領域與興趣" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "這個網站可以看到什麼" })).toBeVisible();
    await expect(main.locator(".section-grid").getByRole("link", { name: "開啟聯絡頁面", exact: true })).toHaveAttribute(
      "href",
      "/zh-hant/contact/",
    );
  });
});
