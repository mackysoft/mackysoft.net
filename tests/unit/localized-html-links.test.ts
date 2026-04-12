import { describe, expect, test } from "vitest";

import { localizeHtmlLinks } from "../../src/lib/localized-html-links";

describe("localized html links", () => {
  test("localizes internal site links for English pages and preserves other hrefs", () => {
    const html = [
      '<p><a href="/articles/vision-introduction/?ref=top#intro">Article</a></p>',
      '<p><a href="/games/treasure-rogue/">Game</a></p>',
      '<p><a href="/playfab-login/">Legacy</a></p>',
      '<p><a href="https://example.com">External</a></p>',
      '<p><a href="#section">Fragment</a></p>',
    ].join("");

    const result = localizeHtmlLinks(html, "en");

    expect(result).toContain('href="/en/articles/vision-introduction/?ref=top#intro"');
    expect(result).toContain('href="/en/games/treasure-rogue/"');
    expect(result).toContain('href="/playfab-login/"');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('href="#section"');
  });

  test("keeps Japanese pages untouched", () => {
    const html = '<p><a href="/articles/vision-introduction/">Article</a></p>';

    expect(localizeHtmlLinks(html, "ja")).toBe(html);
  });
});
