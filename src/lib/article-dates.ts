import type { SiteLocale } from "./i18n";

const ARTICLE_TIME_ZONE = "Asia/Tokyo";

function getNumericDateFormatter(locale: SiteLocale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ja-JP", {
    calendar: "gregory",
    timeZone: ARTICLE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getLongDateFormatter(locale: SiteLocale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "ja-JP", {
    calendar: "gregory",
    timeZone: ARTICLE_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type ArticleDateParts = {
  year: string;
  month: string;
  day: string;
};

export function getArticleDateParts(date: Date, locale: SiteLocale = "ja"): ArticleDateParts {
  const parts = getNumericDateFormatter(locale).formatToParts(date);
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

export function getArticleYear(date: Date, locale: SiteLocale = "ja"): string {
  return getArticleDateParts(date, locale).year;
}

export function getArticleYearMonth(date: Date, locale: SiteLocale = "ja"): { year: string; month: string } {
  const { year, month } = getArticleDateParts(date, locale);
  return { year, month };
}

export function formatArticleDate(date: Date, locale: SiteLocale = "ja"): string {
  if (locale === "ja") {
    const { year, month, day } = getArticleDateParts(date, locale);
    return `${year}年${Number(month)}月${Number(day)}日`;
  }

  return getLongDateFormatter(locale).format(date);
}

export function formatArticleNumericDate(date: Date, locale: SiteLocale = "ja"): string {
  const { year, month, day } = getArticleDateParts(date, locale);

  if (locale === "en") {
    return `${month}/${day}/${year}`;
  }

  return `${year}/${month}/${day}`;
}
