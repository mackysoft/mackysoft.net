import { expect, test, type Page } from "@playwright/test";

type SeoExpectation = {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
};

const sharedSiteName = "mackysoft.net";

const seoExpectations: SeoExpectation[] = [
  {
    path: "/",
    title: "mackysoft.net",
    description: "ゲーム、アセット、技術記事を整理して残すための活動ハブ。",
    canonicalUrl: "https://mackysoft.net/",
  },
  {
    path: "/articles/",
    title: "Articles | mackysoft.net",
    description: "自サイトと Zenn に公開した記事一覧です。",
    canonicalUrl: "https://mackysoft.net/articles/",
  },
  {
    path: "/games/",
    title: "Games | mackysoft.net",
    description: "公開しているゲームの一覧です。",
    canonicalUrl: "https://mackysoft.net/games/",
  },
  {
    path: "/assets/",
    title: "Assets | mackysoft.net",
    description: "GitHub Releases として公開しているアセットの一覧です。",
    canonicalUrl: "https://mackysoft.net/assets/",
  },
  {
    path: "/about/",
    title: "About | Hiroya Aramaki（荒牧裕也）/ Makihiro | mackysoft.net",
    description:
      "Hiroya Aramaki（荒牧裕也）/ Makihiro のプロフィール、ゲーム開発を軸にした活動領域、このサイトの役割、外部リンク、連絡導線をまとめたページです。",
    canonicalUrl: "https://mackysoft.net/about/",
  },
  {
    path: "/search/",
    title: "Search | mackysoft.net",
    description: "サイト内の記事、ゲーム、外部記事、公開アセットを検索できます。",
    canonicalUrl: "https://mackysoft.net/search/",
  },
];

async function expectSeo(page: Page, expectation: SeoExpectation) {
  await page.addInitScript(() => {
    window.localStorage.setItem("mackysoft-locale", "ja");
  });
  await page.goto(expectation.path);

  await expect(page).toHaveTitle(expectation.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", expectation.description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", expectation.canonicalUrl);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", sharedSiteName);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", expectation.title);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", expectation.description);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", expectation.canonicalUrl);
}

test.describe("SEO metadata", () => {
  for (const expectation of seoExpectations) {
    test(`renders shared SEO metadata for ${expectation.path}`, { tag: "@size:medium" }, async ({ page }) => {
      await expectSeo(page, expectation);
    });
  }

  test("renders shared SEO metadata for a localized route", { tag: "@size:medium" }, async ({ page }) => {
    await expectSeo(page, {
      path: "/en/about/",
      title: "About | Hiroya Aramaki / Makihiro | mackysoft.net",
      description:
        "A profile page for Hiroya Aramaki / Makihiro, covering game development, interests, site purpose, external links, and contact paths.",
      canonicalUrl: "https://mackysoft.net/en/about/",
    });
  });
});
