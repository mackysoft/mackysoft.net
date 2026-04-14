import { describe, expect, test } from "vitest";

import { toLocalizedLocalArticleItem, type LocalizedArticleEntry } from "../../src/lib/articles";

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

    expect(articleItem.cover).toBe("/og/articles/turnbased-gameloop.png");
    expect(articleItem.coverAlt).toBe("ターン制のゲームループを実装する方法【C#】 の記事タイトル画像");
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

    expect(articleItem.cover).toBe(authoredCover);
    expect(articleItem.coverAlt).toBe("著者指定カバー");
  });
});
