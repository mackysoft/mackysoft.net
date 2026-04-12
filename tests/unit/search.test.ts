import { describe, expect, test } from "vitest";

import {
  getSearchContentType,
  selectSearchExcerpt,
  selectSearchMatchTitle,
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

  test("uses the first matched anchor URL and exposes the matched section title", () => {
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
    expect(selectSearchMatchTitle(result)).toBe("Specific heading");
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
});
