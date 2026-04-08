import { expect, test } from "@playwright/test";

test("renders the home page bootstrap contract", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("mackysoft.net");
  await expect(page.getByRole("heading", { level: 1, name: "mackysoft.net" })).toBeVisible();
  await expect(page.getByText("Astro minimum bootstrap is ready.")).toBeVisible();
});
