import { expect, test } from "@playwright/test";

const gaMeasurementId = "G-TEST123456";
type AnalyticsWindow = Window & typeof globalThis & {
  gtag?: unknown;
  dataLayer?: unknown[];
};

test.describe("privacy policy page", () => {
  test("renders the Japanese privacy policy with the active data handling details", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/privacy-policy/");

    await expect(page).toHaveTitle("プライバシーポリシー | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Privacy Policy", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "プライバシーポリシー" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "運営者情報と連絡先" })).toBeVisible();
    await expect(main).toContainText("Hiroya Aramaki（荒牧裕也）/ Makihiro");
    await expect(main.getByRole("link", { name: "問い合わせ" })).toHaveAttribute("href", "/contact/");
    await expect(main.getByRole("link", { name: "mackysoft0129@gmail.com" })).toHaveCount(0);
    await expect(main.getByRole("heading", { level: 2, name: "アクセス解析" })).toBeVisible();
    await expect(main).toContainText("Google Analytics 4");
    await expect(main).toContainText("Google signals");
    await expect(main).toContainText("広告向けパーソナライズ機能は利用しません");
    await expect(main).toContainText("_ga");
    await expect(main).toContainText("サイト内検索の送信");
    await expect(main).toContainText("テーマ切替");
    await expect(main).toContainText("言語切替");
    await expect(main).toContainText("サイト内検索で送信された検索語");
    await expect(main.locator("code", { hasText: "__pending_site_search__" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "外部サービス" })).toBeVisible();
    await expect(main).toContainText("Cloudflare Workers");
    await expect(main).toContainText("Google Fonts");
    await expect(main).toContainText("youtube-nocookie.com");
    await expect(main).toContainText("公開リポジトリ情報やリリース情報");
    await expect(main).toContainText("GitHub、X、Zenn");
    await expect(main.locator("code", { hasText: "youtube-nocookie.com" })).toBeVisible();
    await expect(main.locator("code", { hasText: "mackysoft-theme" })).toBeVisible();
    await expect(main.locator("code", { hasText: "mackysoft-locale-scroll" })).toBeVisible();
    await expect(main.locator("code", { hasText: "navigator.languages" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "国外事業者による処理" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "利用者による制御方法" })).toBeVisible();
    await expect(main).toContainText("localStorage");
    await expect(main).toContainText("sessionStorage");
    await expect(main).toContainText("オプトアウト アドオン");
    await expect(main.getByRole("heading", { level: 2, name: "改定日" })).toBeVisible();
    await expect(main).toContainText("制定日: 2026年4月12日");
    await expect(main).toContainText("最終更新日: 2026年4月19日");
    await expect(page.locator(`script[src*="googletagmanager.com/gtag/js?id=${gaMeasurementId}"]`)).toHaveCount(1);
    expect(await page.evaluate(() => typeof (window as AnalyticsWindow).gtag)).toBe("function");
    expect(
      await page.evaluate(() => {
        const analyticsWindow = window as AnalyticsWindow;
        return Array.isArray(analyticsWindow.dataLayer) && analyticsWindow.dataLayer.length >= 2;
      }),
    ).toBe(true);
  });

  test("renders the English privacy policy with the same scope", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/privacy-policy/");

    await expect(page).toHaveTitle("Privacy Policy | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Privacy Policy", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Operator and Contact" })).toBeVisible();
    await expect(main).toContainText("Hiroya Aramaki / Makihiro");
    await expect(main.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/en/contact/");
    await expect(main.getByRole("link", { name: "mackysoft0129@gmail.com" })).toHaveCount(0);
    await expect(main.getByRole("heading", { level: 2, name: "Analytics" })).toBeVisible();
    await expect(main).toContainText("Google Analytics 4");
    await expect(main).toContainText("Google signals");
    await expect(main).toContainText("advertising personalization features are not used");
    await expect(main).toContainText("_ga");
    await expect(main).toContainText("on-site search submissions");
    await expect(main).toContainText("theme switches");
    await expect(main).toContainText("language switches");
    await expect(main).toContainText("search terms submitted through on-site search");
    await expect(main.locator("code", { hasText: "__pending_site_search__" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "External Services" })).toBeVisible();
    await expect(main).toContainText("Cloudflare Workers");
    await expect(main).toContainText("Google Fonts");
    await expect(main).toContainText("youtube-nocookie.com");
    await expect(main).toContainText("public GitHub repository and release information");
    await expect(main).toContainText("GitHub, X, or Zenn");
    await expect(main.locator("code", { hasText: "youtube-nocookie.com" })).toBeVisible();
    await expect(main.locator("code", { hasText: "mackysoft-theme" })).toBeVisible();
    await expect(main.locator("code", { hasText: "mackysoft-locale-scroll" })).toBeVisible();
    await expect(main.locator("code", { hasText: "navigator.languages" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Processing by Overseas Service Providers" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "Visitor Controls" })).toBeVisible();
    await expect(main).toContainText("localStorage");
    await expect(main).toContainText("sessionStorage");
    await expect(main).toContainText("opt-out browser add-on");
    await expect(main.getByRole("heading", { level: 2, name: "Revision Date" })).toBeVisible();
    await expect(main).toContainText("Effective date: April 12, 2026");
    await expect(main).toContainText("Last updated: April 19, 2026");
  });
});
