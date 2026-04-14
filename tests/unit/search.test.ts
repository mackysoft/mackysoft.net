import { describe, expect, test } from "vitest";

import {
  createSearchQueryVariants,
  getSearchContentType,
  getSearchMatchPriority,
  hasExactSearchVariant,
  prepareVisibleSearchResults,
  selectSearchExcerpt,
  selectSearchTargetUrl,
} from "../../src/lib/search";

describe("search helpers", () => {
  test("prefers the matched sub-result excerpt over the page excerpt", () => {
    expect(selectSearchExcerpt({
      url: "/articles/example/",
      excerpt: "page excerpt",
      meta: {
        description: "meta description",
      },
      sub_results: [
        {
          title: "Matched heading",
          url: "/articles/example/#matched-heading",
          excerpt: "matched excerpt",
        },
      ],
    })).toBe("matched excerpt");
  });

  test("falls back from page excerpt to description metadata", () => {
    expect(selectSearchExcerpt({
      url: "/articles/example/",
      excerpt: "page excerpt",
      meta: {
        description: "meta description",
      },
      sub_results: [],
    })).toBe("page excerpt");

    expect(selectSearchExcerpt({
      url: "/articles/example/",
      meta: {
        description: "meta description",
      },
      sub_results: [],
    })).toBe("meta description");
  });

  test("uses the first matched anchor URL", () => {
    const result = {
      url: "/articles/example/",
      meta: {
        title: "Example article",
      },
      sub_results: [
        {
          title: "Specific heading",
          url: "/articles/example/#specific-heading",
          excerpt: "matched excerpt",
        },
      ],
    };

    expect(selectSearchTargetUrl(result)).toBe("/articles/example/#specific-heading");
  });

  test("prefers an explicit target URL from search metadata", () => {
    expect(selectSearchTargetUrl({
      url: "/__search-index/release/ja/example/",
      meta: {
        targetUrl: "https://github.com/mackysoft/example/releases/tag/1.0.0",
      },
      sub_results: [],
    })).toBe("https://github.com/mackysoft/example/releases/tag/1.0.0");
  });

  test("falls back to page for unknown content types", () => {
    expect(getSearchContentType("article")).toBe("article");
    expect(getSearchContentType("unknown")).toBe("page");
    expect(getSearchContentType(undefined)).toBe("page");
  });

  test("creates an exact-first variant for Japanese compound queries", () => {
    const variants = createSearchQueryVariants(
      "ゲームデザイン",
      "ja",
      () => ({
        segment: () => [
          { segment: "ゲーム", isWordLike: true },
          { segment: "デザイン", isWordLike: true },
        ],
      }),
    );

    expect(variants).toEqual([
      { value: "\"ゲーム デザイン\"", strategy: "exact" },
      { value: "ゲームデザイン", strategy: "broad" },
    ]);
  });

  test("does not create an exact variant for single-token Japanese queries", () => {
    const variants = createSearchQueryVariants(
      "ローグライク",
      "ja",
      () => ({
        segment: () => [
          { segment: "ローグライク", isWordLike: true },
        ],
      }),
    );

    expect(variants).toEqual([
      { value: "ローグライク", strategy: "broad" },
    ]);
  });

  test("does not mark ASCII queries as exact-rerank targets", () => {
    expect(hasExactSearchVariant(createSearchQueryVariants("in", "ja"))).toBe(false);
    expect(hasExactSearchVariant(createSearchQueryVariants("ゲームデザイン", "ja", () => ({
      segment: () => [
        { segment: "ゲーム", isWordLike: true },
        { segment: "デザイン", isWordLike: true },
      ],
    })))).toBe(true);
  });

  test("prioritizes exact matches in titles over body-only matches", () => {
    expect(getSearchMatchPriority({
      url: "/articles/gamedesign-contrast-cedec2018/",
      meta: {
        title: "ゲームを面白くする「コントラスト」【ゲームデザイン】",
      },
    }, "ゲームデザイン")).toBe(400);

    expect(getSearchMatchPriority({
      url: "/articles/slay-the-spire-review/",
      excerpt: "参考: ゲームを面白くする「コントラスト」【ゲームデザイン】",
      meta: {
        title: "『Slay the Spire』はなぜ面白いのか",
      },
    }, "ゲームデザイン")).toBe(200);
  });

  test("does not assign match priority to ASCII queries", () => {
    expect(getSearchMatchPriority({
      url: "/articles/example/",
      meta: {
        title: "Implementing GitHub Discussions for Team Development",
      },
    }, "in")).toBe(0);
  });

  test("keeps the original order when reranking is disabled", () => {
    const results = prepareVisibleSearchResults([
      {
        data: {
          url: "/articles/first/",
          meta: {
            title: "Implementing GitHub Discussions for Team Development",
          },
        },
        variantOrder: 0,
        resultOrder: 0,
        score: 10,
      },
      {
        data: {
          url: "/articles/second/",
          meta: {
            title: "Why Vibe-Driven Development Fails in the Generative AI Era",
          },
        },
        variantOrder: 0,
        resultOrder: 1,
        score: 5,
      },
    ], "in", false, "page");

    expect(results.map((result) => result.data.url)).toEqual([
      "/articles/first/",
      "/articles/second/",
    ]);
  });

  test("limits inline results after reranking", () => {
    const filler = Array.from({ length: 20 }, (_, index) => ({
      data: {
        url: `/articles/filler-${index}/`,
        meta: {
          title: `Filler ${index}`,
        },
      },
      variantOrder: 1,
      resultOrder: index,
      score: 100 - index,
    }));

    const exactTitleMatch = {
      data: {
        url: "/articles/gamedesign-contrast-cedec2018/",
        meta: {
          title: "ゲームを面白くする「コントラスト」【ゲームデザイン】",
        },
      },
      variantOrder: 1,
      resultOrder: 20,
      score: 1,
    };

    const results = prepareVisibleSearchResults(
      [...filler, exactTitleMatch],
      "ゲームデザイン",
      true,
      "inline",
    );

    expect(results).toHaveLength(20);
    expect(results[0]?.data.url).toBe("/articles/gamedesign-contrast-cedec2018/");
    expect(results.some((result) => result.data.url === "/articles/gamedesign-contrast-cedec2018/")).toBe(true);
    expect(results.some((result) => result.data.url === "/articles/filler-19/")).toBe(false);
  });
});
