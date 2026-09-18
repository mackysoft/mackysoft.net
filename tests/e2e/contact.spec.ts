import { expect, test } from "@playwright/test";

const contactFormUrl =
  "https://docs.google.com/forms/d/e/1FAIpQLSf2zosaQMlb2cSqkDMRnzx1TSchGjuaHakxfy7LsK5_zLzrBQ/viewform?usp=publish-editor";

test.describe("contact page", () => {
  test("shows contact channels and the reply policy", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/contact/");

    await expect(page).toHaveTitle("問い合わせ | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Contact", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "問い合わせ" })).toBeVisible();

    const contactCards = main.locator(".contact-card");
    await expect(contactCards).toHaveCount(2);

    const contactFormLink = contactCards.first().getByRole("link", { name: "問い合わせフォームを開く" });
    await expect(contactFormLink).toHaveAttribute("href", contactFormUrl);
    await expect(contactFormLink).toHaveAttribute("target", "_blank");
    await expect(contactFormLink).toHaveAttribute("rel", "noreferrer");
    await expect(contactCards.first()).toHaveCSS("background-color", "rgb(220, 239, 255)");
    await expect(contactFormLink).toHaveCSS(
      "background-color",
      "rgb(210, 235, 255)",
    );

    await expect(contactCards.nth(1).getByRole("link", { name: "GitHub を開く" })).toHaveAttribute(
      "href",
      "https://github.com/mackysoft",
    );

    const replyPolicy = main.locator(".reply-policy");
    await expect(replyPolicy.getByRole("heading", { level: 2, name: "返信について" })).toBeVisible();
    await expect(replyPolicy.locator("p")).toHaveCount(2);
  });

  test("shows zh-hant contact channels and the reply policy", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/zh-hant/contact/");

    await expect(page).toHaveTitle("聯絡 | mackysoft.net");

    const main = page.getByRole("main");
    const contactCards = main.locator(".contact-card");

    await expect(main.getByText("Home / Contact", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "聯絡" })).toBeVisible();
    await expect(contactCards.first().getByRole("link", { name: "開啟聯絡表單" })).toHaveAttribute("href", contactFormUrl);
    await expect(contactCards.nth(1).getByRole("link", { name: "開啟 GitHub" })).toHaveAttribute("href", "https://github.com/mackysoft");
    await expect(main.locator(".reply-policy").getByRole("heading", { level: 2, name: "回覆方針" })).toBeVisible();
  });
});
