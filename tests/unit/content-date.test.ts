import { describe, expect, test } from "vitest";

import {
  coerceContentDateInput,
  formatContentDate,
  formatNumericDate,
  getContentDateParts,
  getContentYear,
  getContentYearMonth,
  parseContentDateInput,
} from "../../src/lib/content-date";

describe("content date formatting", () => {
  test("keeps JST dates stable at midnight boundaries", () => {
    const publishedAt = new Date("2021-03-16T00:00:00+09:00");

    expect(getContentDateParts(publishedAt)).toEqual({
      year: "2021",
      month: "03",
      day: "16",
    });
    expect(getContentYear(publishedAt)).toBe("2021");
    expect(getContentYearMonth(publishedAt)).toEqual({
      year: "2021",
      month: "03",
    });
    expect(formatNumericDate(publishedAt)).toBe("2021/03/16");
    expect(formatContentDate(publishedAt)).toBe("2021/03/16");
  });

  test("does not shift archive buckets across month boundaries", () => {
    const publishedAt = new Date("2020-05-01T00:05:00+09:00");

    expect(getContentYearMonth(publishedAt)).toEqual({
      year: "2020",
      month: "05",
    });
    expect(formatNumericDate(publishedAt)).toBe("2020/05/01");
  });

  test("keeps English dates on the same YYYY/MM/DD format", () => {
    const publishedAt = new Date("2021-03-16T00:00:00+09:00");

    expect(getContentDateParts(publishedAt, "en")).toEqual({
      year: "2021",
      month: "03",
      day: "16",
    });
    expect(formatNumericDate(publishedAt, "en")).toBe("2021/03/16");
    expect(formatContentDate(publishedAt, "en")).toBe("2021/03/16");
  });

  test("keeps zh-hant dates on the same YYYY/MM/DD format", () => {
    const publishedAt = new Date("2021-03-16T00:00:00+09:00");

    expect(getContentDateParts(publishedAt, "zh-hant")).toEqual({
      year: "2021",
      month: "03",
      day: "16",
    });
    expect(formatNumericDate(publishedAt, "zh-hant")).toBe("2021/03/16");
    expect(formatContentDate(publishedAt, "zh-hant")).toBe("2021/03/16");
  });

  test("parses date-only input as JST midnight", () => {
    const publishedAt = parseContentDateInput("2026-04-14");

    expect(publishedAt?.toISOString()).toBe("2026-04-13T15:00:00.000Z");
    expect(formatContentDate(publishedAt!)).toBe("2026/04/14");
  });

  test("parses minute-level input as JST time", () => {
    const publishedAt = parseContentDateInput("2026-04-14 13:37");

    expect(publishedAt?.toISOString()).toBe("2026-04-14T04:37:00.000Z");
    expect(formatContentDate(publishedAt!)).toBe("2026/04/14");
  });

  test("keeps unsupported values for schema validation", () => {
    expect(coerceContentDateInput("not-a-date")).toBe("not-a-date");
  });
});
