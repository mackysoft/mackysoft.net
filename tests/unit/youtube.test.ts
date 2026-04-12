import { describe, expect, test } from "vitest";

import { getYouTubeEmbedUrl, getYouTubeVideoId, isSupportedYouTubeUrl } from "../../src/lib/youtube";

describe("youtube helpers", () => {
  test("converts YouTube share URLs into embed URLs", () => {
    expect(getYouTubeVideoId("https://youtu.be/ICE8Qz0S23o?si=QtxWfkapBZ8KpQU6")).toBe("ICE8Qz0S23o");
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=ICE8Qz0S23o")).toBe("ICE8Qz0S23o");
    expect(getYouTubeVideoId("https://m.youtube.com/watch?v=ICE8Qz0S23o")).toBe("ICE8Qz0S23o");
    expect(getYouTubeEmbedUrl("https://youtu.be/ICE8Qz0S23o?si=QtxWfkapBZ8KpQU6")).toBe(
      "https://www.youtube-nocookie.com/embed/ICE8Qz0S23o",
    );
    expect(getYouTubeEmbedUrl("https://www.youtube.com/watch?v=ICE8Qz0S23o")).toBe(
      "https://www.youtube-nocookie.com/embed/ICE8Qz0S23o",
    );
  });

  test("rejects unsupported trailer URLs", () => {
    expect(isSupportedYouTubeUrl("https://vimeo.com/123456")).toBe(false);
    expect(isSupportedYouTubeUrl("https://example.com/trailer")).toBe(false);
    expect(getYouTubeVideoId("https://vimeo.com/123456")).toBeNull();
    expect(getYouTubeEmbedUrl("https://example.com/trailer")).toBeNull();
  });
});
