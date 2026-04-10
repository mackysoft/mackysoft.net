import { describe, expect, test } from "vitest";

import {
  formatArticleDate,
  formatArticleNumericDate,
  getArticleDateParts,
  getArticleYear,
  getArticleYearMonth,
} from "../../src/lib/article-dates";

describe("article date formatting", () => {
  test("keeps JST dates stable at midnight boundaries", () => {
    const publishedAt = new Date("2021-03-16T00:00:00+09:00");

    expect(getArticleDateParts(publishedAt)).toEqual({
      year: "2021",
      month: "03",
      day: "16",
    });
    expect(getArticleYear(publishedAt)).toBe("2021");
    expect(getArticleYearMonth(publishedAt)).toEqual({
      year: "2021",
      month: "03",
    });
    expect(formatArticleNumericDate(publishedAt)).toBe("2021/03/16");
    expect(formatArticleDate(publishedAt)).toBe("2021年3月16日");
  });

  test("does not shift archive buckets across month boundaries", () => {
    const publishedAt = new Date("2020-05-01T00:05:00+09:00");

    expect(getArticleYearMonth(publishedAt)).toEqual({
      year: "2020",
      month: "05",
    });
    expect(formatArticleNumericDate(publishedAt)).toBe("2020/05/01");
  });
});
