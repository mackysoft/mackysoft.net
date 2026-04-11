import { describe, expect, test } from "vitest";

import { getGameDateValue, getGameTrailerEmbedUrl, getGameTrailerVideoId, isExternalGameActionHref, isSupportedGameTrailerUrl } from "../../src/lib/games";

describe("games helpers", () => {
  test("treats site-relative action links as internal", () => {
    expect(isExternalGameActionHref("/privacy-policy/")).toBe(false);
    expect(isExternalGameActionHref("/games/treasure-rogue/press-kit/")).toBe(false);
    expect(isExternalGameActionHref("https://unityroom.com/games/treasure-rogue")).toBe(true);
  });

  test("sorts games by published date instead of updated date", () => {
    expect(getGameDateValue({
      data: {
        publishedAt: new Date("2020-04-09T00:00:00+09:00"),
        updatedAt: new Date("2020-05-21T00:00:00+09:00"),
      },
    } as never)).toBe(new Date("2020-04-09T00:00:00+09:00").valueOf());
  });

  test("converts YouTube share URLs into embed URLs", () => {
    expect(getGameTrailerVideoId("https://youtu.be/ICE8Qz0S23o?si=QtxWfkapBZ8KpQU6")).toBe("ICE8Qz0S23o");
    expect(getGameTrailerVideoId("https://www.youtube.com/watch?v=ICE8Qz0S23o")).toBe("ICE8Qz0S23o");
    expect(getGameTrailerVideoId("https://m.youtube.com/watch?v=ICE8Qz0S23o")).toBe("ICE8Qz0S23o");
    expect(getGameTrailerEmbedUrl("https://youtu.be/ICE8Qz0S23o?si=QtxWfkapBZ8KpQU6")).toBe(
      "https://www.youtube-nocookie.com/embed/ICE8Qz0S23o",
    );
    expect(getGameTrailerEmbedUrl("https://www.youtube.com/watch?v=ICE8Qz0S23o")).toBe(
      "https://www.youtube-nocookie.com/embed/ICE8Qz0S23o",
    );
  });

  test("rejects unsupported trailer URLs", () => {
    expect(isSupportedGameTrailerUrl("https://vimeo.com/123456")).toBe(false);
    expect(isSupportedGameTrailerUrl("https://example.com/trailer")).toBe(false);
    expect(getGameTrailerVideoId("https://vimeo.com/123456")).toBeNull();
    expect(getGameTrailerEmbedUrl("https://example.com/trailer")).toBeNull();
  });
});
