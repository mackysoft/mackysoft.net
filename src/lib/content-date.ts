import { getIntlLocale, type SiteLocale } from "./i18n";

const CONTENT_TIME_ZONE = "Asia/Tokyo";
const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimeMinutePattern = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

function getNumericDateFormatter(locale: SiteLocale) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
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
  const { year, month, day } = getContentDateParts(date, locale);

  return `${year}/${month}/${day}`;
}

export function parseContentDateInput(value: string): Date | null {
  const normalizedValue = value.trim();
  const dateTimeMinuteMatch = normalizedValue.match(dateTimeMinutePattern);

  if (dateTimeMinuteMatch) {
    const [, year, month, day, hour, minute] = dateTimeMinuteMatch;
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+09:00`);
  }

  const dateOnlyMatch = normalizedValue.match(dateOnlyPattern);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  }

  const parsedDate = new Date(normalizedValue);
  return Number.isNaN(parsedDate.valueOf()) ? null : parsedDate;
}

export function coerceContentDateInput(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string") {
    return value;
  }

  return parseContentDateInput(value) ?? value;
}
