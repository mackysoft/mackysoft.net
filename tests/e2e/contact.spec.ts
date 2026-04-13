import { expect, test } from "@playwright/test";

test.describe("contact page", () => {
  test("shows contact channels and the reply policy", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/contact/");

    await expect(page).toHaveTitle("問い合わせ | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Contact", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "問い合わせ" })).toBeVisible();

    const contactCards = main.locator(".contact-card");
    await expect(contactCards).toHaveCount(2);

    await expect(contactCards.first().getByRole("link", { name: "メールで問い合わせる" })).toHaveAttribute(
      "href",
      "mailto:mackysoft0129@gmail.com",
    );

    await expect(contactCards.nth(1).getByRole("link", { name: "GitHub を開く" })).toHaveAttribute(
      "href",
      "https://github.com/mackysoft",
    );

    const replyPolicy = main.locator(".reply-policy");
    await expect(replyPolicy.getByRole("heading", { level: 2, name: "返信について" })).toBeVisible();
    await expect(replyPolicy.locator("p")).toHaveCount(2);
  });
});
