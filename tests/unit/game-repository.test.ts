import { describe, expect, test } from "vitest";

import { getGameDateValue } from "../../src/lib/game-repository";

describe("game repository", () => {
  test("sorts games by published date instead of updated date", () => {
    expect(getGameDateValue({
      data: {
        publishedAt: new Date("2020-04-09T00:00:00+09:00"),
        updatedAt: new Date("2020-05-21T00:00:00+09:00"),
      },
    } as never)).toBe(new Date("2020-04-09T00:00:00+09:00").valueOf());
  });
});
