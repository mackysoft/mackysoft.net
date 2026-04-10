import { expect, test } from "@playwright/test";

test.describe("games page", () => {
  test("uses the shared page header and intro layout", async ({ page }) => {
    await page.goto("/games/");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Games", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "Games" })).toBeVisible();
    await expect(main.getByText("旧サイトのゲーム紹介は引き継がず、新しい情報設計で再構成します。")).toBeVisible();
    await expect(main.getByRole("link", { name: "Treasure Rogue" })).toHaveAttribute("href", "/games/treasure-rogue/");
  });
});
