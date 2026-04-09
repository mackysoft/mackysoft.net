import { expect, test } from "@playwright/test";

test.describe("about page", () => {
  test("renders the profile and focused links", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/about/");

    await expect(page).toHaveTitle("About | Hiroya Aramaki（荒牧裕也）/ Makihiro | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByRole("img", { name: "Makihiro のアイコン" })).toBeVisible();
    await expect(main.getByRole("link", { name: "X を開く" })).toHaveAttribute("href", "https://twitter.com/makihiro_dev");
    await expect(main.getByRole("heading", { level: 1, name: "Hiroya Aramaki（荒牧裕也）/ Makihiro" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "何をしている人か" })).toBeVisible();
    await expect(main.getByText("ゲーム開発を軸に、技術・アセット制作・発信を続けています。")).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "主な領域と関心" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "このサイトで見られるもの" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Games" })).toHaveAttribute("href", "/games/");
    await expect(main.getByText("制作したゲームや公開中の作品を見られます。")).toBeVisible();
    await expect(main.getByRole("link", { name: "Assets" })).toHaveAttribute("href", "/assets/");
    await expect(main.getByText("開発用アセットやツールをまとめています。")).toBeVisible();
    await expect(main.getByRole("link", { name: "Articles" })).toHaveAttribute("href", "/articles/");
    await expect(main.getByText("技術記事や開発に関する文章を読めます。")).toBeVisible();
    await expect(main.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute("href", "/contact/");
    await expect(main.getByText("仕事や相談、問い合わせの案内です。")).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "リンク" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "仕事・問い合わせ" })).toBeVisible();
    await expect(main.getByRole("link", { name: "GitHub" })).toBeVisible();
    await expect(main.getByText("OSS、ライブラリ、公開リポジトリをまとめています。")).toBeVisible();
    await expect(main.getByRole("link", { name: "X", exact: true })).toBeVisible();
    await expect(main.getByText("短い近況や日々の発信はこちらです。")).toBeVisible();
    await expect(main.getByRole("link", { name: "Zenn" })).toBeVisible();
    await expect(main.getByText("技術記事やまとまった知見を公開しています。")).toBeVisible();
    await expect(main.getByRole("link", { name: "YouTube" })).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Contact を開く" })).toHaveAttribute("href", "/contact/");
  });
});
