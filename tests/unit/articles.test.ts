import { describe, expect, test } from "vitest";

import { toExternalArticleItem, toLocalizedLocalArticleItem, type ArticleActivity, type LocalizedArticleEntry } from "../../src/lib/articles";

function createLocalizedArticleEntry(
  overrides: Partial<LocalizedArticleEntry["data"]> & {
    slug?: string;
    href?: string;
    contentLocale?: LocalizedArticleEntry["contentLocale"];
    isFallback?: boolean;
  } = {},
) {
  const slug = overrides.slug ?? "turnbased-gameloop";
  const href = overrides.href ?? `/articles/${slug}/`;
  const contentLocale = overrides.contentLocale ?? "ja";
  const isFallback = overrides.isFallback ?? false;

  return {
    slug,
    requestedLocale: contentLocale,
    contentLocale,
    isFallback,
    availableLocales: [contentLocale],
    entry: {} as never,
    baseEntry: {} as never,
    href,
    data: {
      title: "ターン制のゲームループを実装する方法【C#】",
      description: "desc",
      publishedAt: new Date("2020-06-14T13:34:54.000Z"),
      updatedAt: undefined,
      tags: ["csharp"],
      cover: undefined,
      coverAlt: undefined,
      ...overrides,
    },
  } as LocalizedArticleEntry;
}

describe("article item helpers", () => {
  test("uses the generated title card for local article cards when a custom cover is missing", () => {
    const articleItem = toLocalizedLocalArticleItem(createLocalizedArticleEntry());

    expect(articleItem.cover).toEqual({
      kind: "generated",
      src: "/og/articles/cards/turnbased-gameloop.png",
      alt: "ターン制のゲームループを実装する方法【C#】 の記事タイトル画像",
      width: 480,
      height: 252,
    });
  });

  test("keeps the authored cover for local article cards when one exists", () => {
    const authoredCover = {
      src: "/_astro/authored-cover.webp",
      width: 1200,
      height: 630,
      format: "webp",
    };
    const articleItem = toLocalizedLocalArticleItem(createLocalizedArticleEntry({
      cover: authoredCover as never,
      coverAlt: "著者指定カバー",
    }));

    expect(articleItem.cover).toEqual({
      kind: "local",
      src: authoredCover,
      alt: "著者指定カバー",
      width: 1200,
      height: 630,
    });
  });

  test("prefers English metadata for zh-hant external article cards before Japanese fallback", () => {
    const externalArticle: ArticleActivity = {
      id: "zenn:test",
      source: "Zenn",
      publishedAt: "2026-01-06T03:05:01.000Z",
      locales: {
        ja: {
          title: "日本語記事",
          description: "日本語概要",
          url: "https://zenn.dev/makihiro_dev/articles/test",
        },
        en: {
          title: "English article",
          description: "English summary",
          url: "https://zenn.dev/makihiro_dev/articles/test?locale=en",
        },
      },
    };

    expect(toExternalArticleItem(externalArticle, "zh-hant")).toMatchObject({
      title: "English article",
      description: "English summary",
      href: "https://zenn.dev/makihiro_dev/articles/test?locale=en",
      contentLocale: "en",
      isFallback: true,
    });

    expect(toExternalArticleItem({
      ...externalArticle,
      locales: {
        ja: externalArticle.locales.ja,
      },
    }, "zh-hant")).toMatchObject({
      title: "日本語記事",
      description: "日本語概要",
      href: "https://zenn.dev/makihiro_dev/articles/test",
      contentLocale: "ja",
      isFallback: true,
    });
  });

  test("prefers English metadata for Korean external article cards before Japanese fallback", () => {
    const externalArticle: ArticleActivity = {
      id: "zenn:test",
      source: "Zenn",
      publishedAt: "2026-01-06T03:05:01.000Z",
      locales: {
        ja: {
          title: "日本語記事",
          description: "日本語概要",
          url: "https://zenn.dev/makihiro_dev/articles/test",
        },
        en: {
          title: "English article",
          description: "English summary",
          url: "https://zenn.dev/makihiro_dev/articles/test?locale=en",
        },
      },
    };

    expect(toExternalArticleItem(externalArticle, "ko")).toMatchObject({
      title: "English article",
      description: "English summary",
      href: "https://zenn.dev/makihiro_dev/articles/test?locale=en",
      contentLocale: "en",
      isFallback: true,
    });
  });
});
