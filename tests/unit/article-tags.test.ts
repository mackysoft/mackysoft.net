import { describe, expect, test } from "vitest";

import { articleTagDefinitions, getArticleTagLabel } from "../../src/lib/article-tags";

describe("article tags", () => {
  test("returns localized labels for registered keys", () => {
    expect(getArticleTagLabel("asset", "ja")).toBe("アセット");
    expect(getArticleTagLabel("game-design", "en")).toBe("Game Design");
    expect(getArticleTagLabel("completion-detection", "ja")).toBe("終了判定");
  });

  test("falls back to the key when no localization is defined", () => {
    expect(getArticleTagLabel("unknown-tag", "en")).toBe("unknown-tag");
  });

  test("keeps the localization dictionary addressable by arbitrary tag keys", () => {
    expect(articleTagDefinitions["completion-detection"]?.label.ja).toBe("終了判定");
    expect(articleTagDefinitions["custom-tag"]).toBeUndefined();
  });
});
