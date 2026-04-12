import { describe, expect, test } from "vitest";

import {
  createAlternateLocaleLinks,
  getLocalePreference,
  getPathLocale,
  matchBrowserLocaleCandidate,
  localizeContentHref,
  localizePath,
  sortBrowserLocaleMatchers,
  stripLocaleFromPath,
  switchLocalePath,
} from "../../src/lib/i18n";

describe("i18n helpers", () => {
  test("detects the locale from the pathname prefix", () => {
    expect(getPathLocale("/")).toBe("ja");
    expect(getPathLocale("/articles/vision-introduction/")).toBe("ja");
    expect(getPathLocale("/en/")).toBe("en");
    expect(getPathLocale("/en/articles/vision-introduction/")).toBe("en");
  });

  test("adds and removes locale prefixes consistently", () => {
    expect(stripLocaleFromPath("/")).toBe("/");
    expect(stripLocaleFromPath("/en/")).toBe("/");
    expect(stripLocaleFromPath("/en/articles/vision-introduction/")).toBe("/articles/vision-introduction/");

    expect(localizePath("/", "ja")).toBe("/");
    expect(localizePath("/", "en")).toBe("/en/");
    expect(localizePath("/articles/vision-introduction/", "ja")).toBe("/articles/vision-introduction/");
    expect(localizePath("/articles/vision-introduction/", "en")).toBe("/en/articles/vision-introduction/");
    expect(switchLocalePath("/en/articles/vision-introduction/", "ja")).toBe("/articles/vision-introduction/");
    expect(switchLocalePath("/articles/vision-introduction/", "en")).toBe("/en/articles/vision-introduction/");
    expect(createAlternateLocaleLinks("/articles/vision-introduction/")).toEqual([
      { locale: "ja", path: "/articles/vision-introduction/" },
      { locale: "en", path: "/en/articles/vision-introduction/" },
    ]);
  });

  test("localizes only known site content links", () => {
    expect(localizeContentHref("/articles/vision-introduction/", "en")).toBe("/en/articles/vision-introduction/");
    expect(localizeContentHref("/games/treasure-rogue/?from=article#play", "en")).toBe("/en/games/treasure-rogue/?from=article#play");
    expect(localizeContentHref("/", "en")).toBe("/en/");
    expect(localizeContentHref("/playfab-login/", "en")).toBe("/playfab-login/");
    expect(localizeContentHref("https://zenn.dev/makihiro_dev", "en")).toBe("https://zenn.dev/makihiro_dev");
    expect(localizeContentHref("#visionとは", "en")).toBe("#visionとは");
  });

  test("prefers supported browser languages in order and falls back to Japanese", () => {
    expect(getLocalePreference(["fr-FR", "en-US", "ja-JP"])).toBe("en");
    expect(getLocalePreference(["de-DE", "ja-JP"])).toBe("ja");
    expect(getLocalePreference(["fr-FR"])).toBe("ja");
    expect(getLocalePreference(null)).toBe("ja");
  });

  test("prefers the most specific browser locale matcher", () => {
    const matchers = sortBrowserLocaleMatchers([
      { locale: "en", prefix: "en" },
      { locale: "en-gb", prefix: "en-gb" },
      { locale: "zh", prefix: "zh" },
      { locale: "zh-cn", prefix: "zh-cn" },
    ]);

    expect(matchBrowserLocaleCandidate("en-GB", matchers)).toBe("en-gb");
    expect(matchBrowserLocaleCandidate("zh-CN", matchers)).toBe("zh-cn");
    expect(matchBrowserLocaleCandidate("en-AU", matchers)).toBe("en");
    expect(matchBrowserLocaleCandidate("fr-FR", matchers)).toBeNull();
  });
});
