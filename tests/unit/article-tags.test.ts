import { describe, expect, test } from "vitest";

import { articleTagDefinitions, getArticleTagLabel } from "../../src/lib/article-tags";

describe("article tags", () => {
  test("returns localized labels for registered keys", () => {
    expect(getArticleTagLabel("asset", "ja")).toBe("アセット");
    expect(getArticleTagLabel("game-design", "en")).toBe("Game Design");
    expect(getArticleTagLabel("asset", "zh-hant")).toBe("資產");
    expect(getArticleTagLabel("completion-detection", "ja")).toBe("終了判定");
    expect(getArticleTagLabel("play-review", "en")).toBe("Play Review");
    expect(getArticleTagLabel("tsukuru-uozu", "ja")).toBe("つくるUOZU");
  });

  test("falls back to the key when no localization is defined", () => {
    expect(getArticleTagLabel("unknown-tag", "en")).toBe("unknown-tag");
  });

  test("falls back to English labels when zh-hant-specific labels are not defined", () => {
    expect(getArticleTagLabel("unity", "zh-hant")).toBe("Unity");
  });

  test("keeps the localization dictionary addressable by arbitrary tag keys", () => {
    expect(articleTagDefinitions["completion-detection"]?.label.ja).toBe("終了判定");
    expect(articleTagDefinitions["custom-tag"]).toBeUndefined();
  });
});
