import { expect, test } from "@playwright/test";

test.describe("games page", () => {
  test("uses the shared page header and intro layout", async ({ page }) => {
    await page.goto("/games/");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Games", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "Games" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Treasure Rogue" })).toHaveAttribute("href", "/games/treasure-rogue/");
  });
});
