import { expect, test, type Page } from "@playwright/test";

type SeoExpectation = {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
};

const sharedSiteName = "mackysoft.net";
const defaultImageUrl = "https://mackysoft.net/og/default.png";
const defaultImageAltJa = "mackysoft.net のカバー画像";
const defaultImageAltEn = "mackysoft.net cover image";

const seoExpectations: SeoExpectation[] = [
  {
    path: "/",
    title: "mackysoft.net",
    description: "ゲーム、アセット、技術記事を整理して残すための活動ハブ。",
    canonicalUrl: "https://mackysoft.net/",
    imageUrl: defaultImageUrl,
    imageAlt: defaultImageAltJa,
  },
  {
    path: "/articles/",
    title: "記事 | mackysoft.net",
    description: "自サイトと Zenn に公開した記事一覧です。",
    canonicalUrl: "https://mackysoft.net/articles/",
    imageUrl: defaultImageUrl,
    imageAlt: defaultImageAltJa,
  },
  {
    path: "/games/",
    title: "ゲーム | mackysoft.net",
    description: "公開しているゲームの一覧です。",
    canonicalUrl: "https://mackysoft.net/games/",
    imageUrl: defaultImageUrl,
    imageAlt: defaultImageAltJa,
  },
  {
    path: "/assets/",
    title: "アセット | mackysoft.net",
    description: "GitHub Releases として公開しているアセットの一覧です。",
    canonicalUrl: "https://mackysoft.net/assets/",
    imageUrl: defaultImageUrl,
    imageAlt: defaultImageAltJa,
  },
  {
    path: "/about/",
    title: "プロフィール | Hiroya Aramaki（荒牧裕也）/ Makihiro | mackysoft.net",
    description:
      "Hiroya Aramaki（荒牧裕也）/ Makihiro のプロフィール、ゲーム開発を軸にした活動領域、このサイトの役割、外部リンク、連絡導線をまとめたページです。",
    canonicalUrl: "https://mackysoft.net/about/",
    imageUrl: defaultImageUrl,
    imageAlt: defaultImageAltJa,
  },
  {
    path: "/search/",
    title: "検索 | mackysoft.net",
    description: "サイト内の記事、ゲーム、外部記事、公開アセットを検索できます。",
    canonicalUrl: "https://mackysoft.net/search/",
    imageUrl: defaultImageUrl,
    imageAlt: defaultImageAltJa,
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
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", expectation.imageUrl);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", expectation.imageAlt);
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "630");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", expectation.imageUrl);
  await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute("content", expectation.imageAlt);
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", "https://mackysoft.net/feed.xml");
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
      imageUrl: defaultImageUrl,
      imageAlt: defaultImageAltEn,
    });
  });

  test("uses the article cover when a local article defines one", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/vision-introduction/");

    const ogImage = page.locator('meta[property="og:image"]');

    await expect(ogImage).not.toHaveAttribute("content", defaultImageUrl);
    await expect(ogImage).toHaveAttribute("content", /\/_astro\//);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "【Unity】CullingGroupをより簡単に実装する【Vision】 の記事画像",
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/_astro\//);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
      "content",
      "【Unity】CullingGroupをより簡単に実装する【Vision】 の記事画像",
    );
  });

  test("falls back to the default cover when a local article has no cover", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/turnbased-gameloop/");

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", defaultImageUrl);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", defaultImageAltJa);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", defaultImageUrl);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute("content", defaultImageAltJa);
  });

  test("uses the game cover on game detail pages", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/games/treasure-rogue/");

    const ogImage = page.locator('meta[property="og:image"]');

    await expect(ogImage).not.toHaveAttribute("content", defaultImageUrl);
    await expect(ogImage).toHaveAttribute("content", /\/_astro\//);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "Treasure Rogue のタイトルロゴと主人公が写ったキービジュアル",
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", /\/_astro\//);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
      "content",
      "Treasure Rogue のタイトルロゴと主人公が写ったキービジュアル",
    );
  });
});
