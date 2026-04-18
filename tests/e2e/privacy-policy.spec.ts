import { expect, test } from "@playwright/test";

const gaMeasurementId = "G-TEST123456";
type AnalyticsWindow = Window & typeof globalThis & {
  gtag?: unknown;
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
    await expect(main).toContainText("ページ閲覧・操作計測のパラメータ");
    await expect(main.locator("code", { hasText: "__pending_analytics_events__" })).toBeVisible();
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
    expect(await page.evaluate(() => typeof (window as AnalyticsWindow).gtag)).toBe("function");
    expect(
      await page.evaluate((measurementId) => {
        const configElement = document.getElementById("site-analytics-config");

        if (!(configElement instanceof HTMLScriptElement)) {
          return false;
        }

        try {
          const config = JSON.parse(configElement.textContent ?? "") as { measurementId?: unknown };
          return config.measurementId === measurementId;
        } catch {
          return false;
        }
      }, gaMeasurementId),
    ).toBe(true);
    expect(
      await page.evaluate(() => {
        return Array.from(document.head.querySelectorAll("script")).some((script) => {
          return script instanceof HTMLScriptElement
            && script.src === ""
            && (script.textContent ?? "").includes("__pending_analytics_events__");
        });
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
    await expect(main).toContainText("Page-view and interaction analytics parameters");
    await expect(main.locator("code", { hasText: "__pending_analytics_events__" })).toBeVisible();
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

  test("renders the zh-hant privacy policy with the same scope", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/zh-hant/privacy-policy/");

    await expect(page).toHaveTitle("隱私權政策 | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Privacy Policy", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "營運者資訊與聯絡方式" })).toBeVisible();
    await expect(main).toContainText("Hiroya Aramaki（荒牧裕也）/ Makihiro");
    await expect(main.getByRole("link", { name: "聯絡方式" })).toHaveAttribute("href", "/zh-hant/contact/");
    await expect(main.getByRole("heading", { level: 2, name: "流量分析" })).toBeVisible();
    await expect(main).toContainText("Google Analytics 4");
    await expect(main).toContainText("Google signals");
    await expect(main).toContainText("主題切換");
    await expect(main).toContainText("語言切換");
    await expect(main).toContainText("站內搜尋的送出");
    await expect(main).toContainText("在站內搜尋中送出的搜尋詞");
    await expect(main.locator("code", { hasText: "__pending_site_search__" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "外部服務" })).toBeVisible();
    await expect(main).toContainText("公開儲存庫資訊與 Release 資訊");
    await expect(main.getByRole("heading", { level: 2, name: "由海外業者進行的處理" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "使用者可採取的控制方式" })).toBeVisible();
    await expect(main).toContainText("制定日: 2026年4月12日");
    await expect(main).toContainText("最後更新日: 2026年4月19日");
  });

  test("renders the Korean privacy policy with the same scope", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/ko/privacy-policy/");

    await expect(page).toHaveTitle("개인정보 처리방침 | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / Privacy Policy", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "운영자 정보와 연락처" })).toBeVisible();
    await expect(main).toContainText("Hiroya Aramaki(아라마키 히로야) / Makihiro");
    await expect(main.getByRole("link", { name: "연락처" })).toHaveAttribute("href", "/ko/contact/");
    await expect(main.getByRole("heading", { level: 2, name: "분석" })).toBeVisible();
    await expect(main).toContainText("Google Analytics 4");
    await expect(main).toContainText("Google signals");
    await expect(main).toContainText("테마 전환");
    await expect(main).toContainText("언어 전환");
    await expect(main).toContainText("사이트 내 검색 제출");
    await expect(main).toContainText("사이트 내 검색에서 제출된 검색어");
    await expect(main.locator("code", { hasText: "__pending_site_search__" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "외부 서비스" })).toBeVisible();
    await expect(main).toContainText("공개 저장소 정보와 릴리스 정보");
    await expect(main.getByRole("heading", { level: 2, name: "해외 사업자에 의한 처리" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "이용자의 통제 방법" })).toBeVisible();
    await expect(main).toContainText("시행일: 2026년 4월 12일");
    await expect(main).toContainText("최종 업데이트: 2026년 4월 19일");
  });
});
