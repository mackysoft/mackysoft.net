import { expect, test, type Page } from "@playwright/test";

type SeoExpectation = {
  path: string;
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  robotsContent?: string;
};

const sharedSiteName = "mackysoft.net";
const defaultImageUrl = "https://mackysoft.net/og/default.png";
const defaultImageAltJa = "mackysoft.net のカバー画像";
const defaultImageAltEn = "mackysoft.net cover image";
const defaultImageAltZhHant = "mackysoft.net 封面圖片";
const defaultImageAltKo = "mackysoft.net 커버 이미지";
const generatedArticleImageJa = "https://mackysoft.net/og/articles/turnbased-gameloop.png";
const generatedArticleImageEn = "https://mackysoft.net/en/og/articles/turnbased-gameloop.png";
const generatedArticleImageZhHant = "https://mackysoft.net/zh-hant/og/articles/turnbased-gameloop.png";
const generatedArticleImageKo = "https://mackysoft.net/ko/og/articles/turnbased-gameloop.png";

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
    robotsContent: "noindex, follow",
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
  await expect(page.locator('link[rel="alternate"][hreflang="zh-Hant"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="ko"]')).toHaveCount(1);

  if (expectation.robotsContent) {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", expectation.robotsContent);
  } else {
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  }
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

  test("renders shared SEO metadata for a zh-hant localized route", { tag: "@size:medium" }, async ({ page }) => {
    await expectSeo(page, {
      path: "/zh-hant/about/",
      title: "個人簡介 | Hiroya Aramaki / Makihiro | mackysoft.net",
      description:
        "整理 Hiroya Aramaki / Makihiro 的個人簡介、以遊戲開發為核心的活動領域、網站定位、外部連結與聯絡方式的頁面。",
      canonicalUrl: "https://mackysoft.net/zh-hant/about/",
      imageUrl: defaultImageUrl,
      imageAlt: defaultImageAltZhHant,
    });
  });

  test("renders shared SEO metadata for a Korean localized route", { tag: "@size:medium" }, async ({ page }) => {
    await expectSeo(page, {
      path: "/ko/about/",
      title: "소개 | Hiroya Aramaki / Makihiro | mackysoft.net",
      description:
        "Hiroya Aramaki / Makihiro의 프로필, 게임 개발을 중심으로 한 활동 영역, 사이트의 역할, 외부 링크, 연락 경로를 정리한 페이지입니다.",
      canonicalUrl: "https://mackysoft.net/ko/about/",
      imageUrl: defaultImageUrl,
      imageAlt: defaultImageAltKo,
    });
  });

  test("marks privacy policy pages as noindex", { tag: "@size:medium" }, async ({ page }) => {
    const expectations = [
      ["/privacy-policy/", "https://mackysoft.net/privacy-policy/"],
      ["/en/privacy-policy/", "https://mackysoft.net/en/privacy-policy/"],
      ["/zh-hant/privacy-policy/", "https://mackysoft.net/zh-hant/privacy-policy/"],
      ["/ko/privacy-policy/", "https://mackysoft.net/ko/privacy-policy/"],
    ] as const;

    for (const [path, canonicalUrl] of expectations) {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonicalUrl);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    }
  });

  test("marks contact pages as noindex", { tag: "@size:medium" }, async ({ page }) => {
    const expectations = [
      ["/contact/", "https://mackysoft.net/contact/"],
      ["/en/contact/", "https://mackysoft.net/en/contact/"],
      ["/zh-hant/contact/", "https://mackysoft.net/zh-hant/contact/"],
      ["/ko/contact/", "https://mackysoft.net/ko/contact/"],
    ] as const;

    for (const [path, canonicalUrl] of expectations) {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonicalUrl);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
    }
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

  test("uses a generated title card when a local article has no cover", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/articles/turnbased-gameloop/");

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", generatedArticleImageJa);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", "ターン制のゲームループを実装する方法【C#】 の記事タイトル画像");
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", generatedArticleImageJa);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
      "content",
      "ターン制のゲームループを実装する方法【C#】 の記事タイトル画像",
    );
  });

  test("uses a localized generated title card when an English article has no cover", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/en/articles/turnbased-gameloop/");

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", generatedArticleImageEn);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "Title card for How to Implement a Turn-Based Game Loop [C#]",
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", generatedArticleImageEn);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
      "content",
      "Title card for How to Implement a Turn-Based Game Loop [C#]",
    );
  });

  test("uses a localized generated title card when a zh-hant article has no cover", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/zh-hant/articles/turnbased-gameloop/");

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", generatedArticleImageZhHant);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "如何實作回合制的遊戲迴圈【C#】 的文章標題圖片",
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", generatedArticleImageZhHant);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
      "content",
      "如何實作回合制的遊戲迴圈【C#】 的文章標題圖片",
    );
  });

  test("uses a localized generated title card when a Korean article has no cover", { tag: "@size:medium" }, async ({ page }) => {
    await page.goto("/ko/articles/turnbased-gameloop/");

    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", generatedArticleImageKo);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      "턴제 게임 루프를 구현하는 방법 [C#] 글 제목 이미지",
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", generatedArticleImageKo);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute(
      "content",
      "턴제 게임 루프를 구현하는 방법 [C#] 글 제목 이미지",
    );
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
