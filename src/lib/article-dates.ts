const ARTICLE_TIME_ZONE = "Asia/Tokyo";

const articleDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  calendar: "gregory",
  timeZone: ARTICLE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type ArticleDateParts = {
  year: string;
  month: string;
  day: string;
};

export function getArticleDateParts(date: Date): ArticleDateParts {
  const parts = articleDateFormatter.formatToParts(date);
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

export function getArticleYear(date: Date): string {
  return getArticleDateParts(date).year;
}

export function getArticleYearMonth(date: Date): { year: string; month: string } {
  const { year, month } = getArticleDateParts(date);
  return { year, month };
}

export function formatArticleDate(date: Date): string {
  const { year, month, day } = getArticleDateParts(date);
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function formatArticleNumericDate(date: Date): string {
  const { year, month, day } = getArticleDateParts(date);
  return `${year}/${month}/${day}`;
}
