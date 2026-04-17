import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const analyticsStorageKey = "__analytics_events__";
const analyticsInitKey = "__analytics_capture_initialized__";

async function setJapaneseLocaleWithAnalyticsCapture(page: Page) {
  await page.addInitScript(({ storageKey, initKey }) => {
    const dataLayer: unknown[] = [];
    const originalPush = Array.prototype.push;

    dataLayer.push = function push(...items: unknown[]) {
      const result = originalPush.apply(this, items);
      const storedEvents = JSON.parse(window.sessionStorage.getItem(storageKey) ?? "[]");
      const serializedEvents = items.map((item) => {
        if (!item || typeof item !== "object" || !("length" in item)) {
          return item;
        }

        return Array.from(item as ArrayLike<unknown>, (value) => {
          return value instanceof Date ? value.toISOString() : value;
        });
      });

      storedEvents.push(...serializedEvents);
      window.sessionStorage.setItem(storageKey, JSON.stringify(storedEvents));
      return result;
    };

    if (window.sessionStorage.getItem(initKey) !== "true") {
      window.sessionStorage.removeItem(storageKey);
      window.sessionStorage.setItem(initKey, "true");
    }

    window.localStorage.setItem("mackysoft-locale", "ja");
    Object.defineProperty(window, "dataLayer", {
      configurable: true,
      writable: true,
      value: dataLayer,
    });
  }, { storageKey: analyticsStorageKey, initKey: analyticsInitKey });
}

async function getTrackedAnalyticsEvents(page: Page, eventName: string) {
  return page.evaluate(({ storageKey, trackedEventName }) => {
    const storedEvents = window.sessionStorage.getItem(storageKey);
    const events = storedEvents ? JSON.parse(storedEvents) : [];

    return events.filter((event: unknown) => {
      return Array.isArray(event) && event[0] === "event" && event[1] === trackedEventName;
    });
  }, { storageKey: analyticsStorageKey, trackedEventName: eventName });
}

test.describe("about page", () => {
  test("renders the profile and focused links", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/about/");

    await expect(page).toHaveTitle("プロフィール | Hiroya Aramaki（荒牧裕也）/ Makihiro | mackysoft.net");

    const main = page.getByRole("main");

    await expect(main.getByText("Home / About", { exact: true })).toBeVisible();
    await expect(main.getByRole("heading", { level: 1, name: "プロフィール" })).toBeVisible();
    await expect(main.getByRole("img", { name: "Makihiro のアイコン" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Twitter を開く" })).toHaveAttribute("href", "https://twitter.com/makihiro_dev");
    await expect(main.locator(".profile-name")).toContainText("Makihiro");
    await expect(main.getByRole("heading", { level: 2, name: "何をしている人か" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "主な領域と関心" })).toBeVisible();
    expect(await main.locator(".interest-list li").count()).toBeGreaterThan(0);
    await expect(main.getByRole("heading", { level: 2, name: "このサイトで見られるもの" })).toBeVisible();
    const siteGuide = main.locator(".about-section").filter({ hasText: "このサイトで見られるもの" });
    await expect(siteGuide.getByRole("link", { name: "ゲーム" })).toHaveAttribute("href", "/games/");
    await expect(siteGuide.getByRole("link", { name: "アセット" })).toHaveAttribute("href", "/assets/");
    await expect(siteGuide.getByRole("link", { name: "記事" })).toHaveAttribute("href", "/articles/");
    await expect(siteGuide.getByRole("link", { name: "問い合わせ", exact: true })).toHaveAttribute("href", "/contact/");
    await expect(main.getByRole("heading", { level: 2, name: "外部リンク" })).toBeVisible();
    await expect(main.getByRole("heading", { level: 2, name: "仕事・問い合わせ" })).toBeVisible();
    await expect(main.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/mackysoft");
    await expect(main.getByRole("link", { name: "Twitter", exact: true })).toHaveAttribute("href", "https://twitter.com/makihiro_dev");
    await expect(main.getByRole("link", { name: "Zenn" })).toHaveAttribute("href", "https://zenn.dev/makihiro_dev");
    await expect(main.getByRole("link", { name: "YouTube" })).toHaveCount(0);
    await expect(main.locator(".section-grid").getByRole("link", { name: "問い合わせ先を見る", exact: true })).toHaveAttribute("href", "/contact/");
  });

  test("tracks the contact CTA as a project CTA click", { tag: "@size:medium" }, async ({ page }) => {
    await setJapaneseLocaleWithAnalyticsCapture(page);
    await page.goto("/about/");

    await page.locator(".section-grid").getByRole("link", { name: "問い合わせ先を見る", exact: true }).click();
    await expect(page).toHaveURL("/contact/");

    const trackedEvents = await getTrackedAnalyticsEvents(page, "project_cta_click");

    expect(trackedEvents).toHaveLength(1);
    expect(trackedEvents[0]).toMatchObject([
      "event",
      "project_cta_click",
      {
        target_label: "問い合わせ先を見る",
        ui_location: "about-contact",
        target_href: "http://127.0.0.1:4322/contact/",
      },
    ]);
  });
});
