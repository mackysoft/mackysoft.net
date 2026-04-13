import { expect, test } from "@playwright/test";

test.describe("legacy redirects", () => {
  test("redirects the legacy game URL while preserving query and hash", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/treasure-rogue/?from=legacy#play");

    await expect(page).toHaveURL(/\/games\/treasure-rogue\/\?from=legacy#play$/);
    await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "Treasure Rogue" })).toBeVisible();
  });

  test("redirects the legacy privacy policy URL to the current page", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/treasure-rogue/privacy-policy/");

    await expect(page).toHaveURL("/privacy-policy/");
    await expect(page.getByRole("main").getByRole("heading", { level: 1, name: "プライバシーポリシー" })).toBeVisible();
  });
});
