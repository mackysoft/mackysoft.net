import { expect, test } from "@playwright/test";

test("renders the home page as an activity hub", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("mackysoft.net");
  await expect(page.getByRole("heading", { level: 1, name: "mackysoft.net" })).toBeVisible();
  await expect(page.getByText("静かな技術系ポートフォリオ")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Articles", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "移行済みの記事" })).toBeVisible();
});

test("returns 404 for draft article routes", async ({ page }) => {
  const response = await page.goto("/articles/round-floor-ceil/");

  expect(response?.status()).toBe(404);
});
