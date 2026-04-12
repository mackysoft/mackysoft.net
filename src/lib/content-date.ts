import type { SiteLocale } from "./i18n";

const CONTENT_TIME_ZONE = "Asia/Tokyo";

function getNumericDateFormatter() {
  return new Intl.DateTimeFormat("ja-JP", {
    calendar: "gregory",
    timeZone: CONTENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

type ContentDateParts = {
  year: string;
  month: string;
  day: string;
};

export function getContentDateParts(date: Date, locale: SiteLocale = "ja"): ContentDateParts {
  void locale;
  const parts = getNumericDateFormatter().formatToParts(date);
  let year = "";
  let month = "";
  let day = "";

  for (const part of parts) {
    if (part.type === "year") {
      year = part.value;
    } else if (part.type === "month") {
      month = part.value;
    } else if (part.type === "day") {
      day = part.value;
    }
  }

  return { year, month, day };
}

export function getContentYear(date: Date, locale: SiteLocale = "ja"): string {
  return getContentDateParts(date, locale).year;
}

export function getContentYearMonth(date: Date, locale: SiteLocale = "ja"): { year: string; month: string } {
  const { year, month } = getContentDateParts(date, locale);
  return { year, month };
}

export function formatContentDate(date: Date, locale: SiteLocale = "ja"): string {
  return formatNumericDate(date, locale);
}

export function formatNumericDate(date: Date, locale: SiteLocale = "ja"): string {
  void locale;
  const { year, month, day } = getContentDateParts(date, locale);

  return `${year}/${month}/${day}`;
}
