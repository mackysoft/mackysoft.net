import { describe, expect, test } from "vitest";

import {
  createTranslationMap,
  normalizeTranslationId,
  resolveLocalizedEntryBySlug,
  resolveLocalizedFallbackState,
} from "../../src/lib/localized-entry";

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

    expect(translationMap.get("treasure-rogue")?.get("en")).toBe(entry);
  });

  test("derives fallback state from the requested locale and available locales", () => {
    expect(resolveLocalizedFallbackState("en", ["en"])).toEqual({
      contentLocale: "en",
      isFallback: false,
      availableLocales: ["ja", "en"],
    });
    expect(resolveLocalizedFallbackState("ja", ["en"])).toEqual({
      contentLocale: "ja",
      isFallback: false,
      availableLocales: ["ja", "en"],
    });
    expect(resolveLocalizedFallbackState("en")).toEqual({
      contentLocale: "ja",
      isFallback: true,
      availableLocales: ["ja"],
    });
  });

  test("resolves a localized entry by slug with English fallback handling", async () => {
    const baseEntry = {
      id: "vision-introduction",
      data: {
        title: "Vision Introduction",
      },
    };
    const translationEntry = {
      id: "vision-introduction/index.en",
      filePath: "src/content/articles/vision-introduction/index.en.md",
      data: {
        title: "Introduction to Vision",
      },
    };

    await expect(
      resolveLocalizedEntryBySlug({
        slug: "vision-introduction",
        locale: "en",
        getBaseEntries: async () => [baseEntry],
        getTranslationMap: async () => createTranslationMap([translationEntry], { stripPrefix: "src/content/articles/" }),
        mergeData: (base, translation) => ({
          title: translation?.data.title ?? base.data.title,
        }),
      }),
    ).resolves.toEqual({
      slug: "vision-introduction",
      requestedLocale: "en",
      contentLocale: "en",
      isFallback: false,
      availableLocales: ["ja", "en"],
      baseEntry,
      translationEntry,
      data: {
        title: "Introduction to Vision",
      },
    });

    await expect(
      resolveLocalizedEntryBySlug({
        slug: "vision-introduction",
        locale: "en",
        getBaseEntries: async () => [baseEntry],
        getTranslationMap: async () => new Map<string, Map<"en" | "ja", typeof translationEntry>>(),
        mergeData: (base, translation) => ({
          title: translation?.data.title ?? base.data.title,
        }),
      }),
    ).resolves.toEqual({
      slug: "vision-introduction",
      requestedLocale: "en",
      contentLocale: "ja",
      isFallback: true,
      availableLocales: ["ja"],
      baseEntry,
      translationEntry: undefined,
      data: {
        title: "Vision Introduction",
      },
    });
  });
});
