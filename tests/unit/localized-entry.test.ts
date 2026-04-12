import { describe, expect, test } from "vitest";

import { createTranslationMap, normalizeTranslationId, resolveLocalizedFallbackState } from "../../src/lib/localized-entry";

describe("localized entry helpers", () => {
  test("normalizes translation ids for Astro entry ids and file paths", () => {
    expect(normalizeTranslationId("vision-introduction/index.en")).toBe("vision-introduction");
    expect(normalizeTranslationId("src/content/games/treasure-rogue/index.en.md", { stripPrefix: "src/content/games/" })).toBe(
      "treasure-rogue",
    );
  });

  test("builds a translation map from both entry ids and file paths", () => {
    const entry = {
      id: "treasure-rogue/index.en",
      filePath: "src/content/games/treasure-rogue/index.en.md",
      data: {},
    };
    const translationMap = createTranslationMap([entry], { stripPrefix: "src/content/games/" });

    expect(translationMap.get("treasure-rogue")).toBe(entry);
  });

  test("derives fallback state from the requested locale and translation presence", () => {
    expect(resolveLocalizedFallbackState("en", true)).toEqual({
      contentLocale: "en",
      isFallback: false,
      availableLocales: ["ja", "en"],
    });
    expect(resolveLocalizedFallbackState("en", false)).toEqual({
      contentLocale: "ja",
      isFallback: true,
      availableLocales: ["ja"],
    });
  });
});
