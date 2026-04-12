import { getIntlLocale, type SiteLocale } from "./i18n";

export const searchContentTypes = ["article", "game", "asset", "page"] as const;

export type SearchContentType = (typeof searchContentTypes)[number];

export type SearchResultSubResultLike = {
  title?: string | null;
  url?: string | null;
  excerpt?: string | null;
};

export type SearchResultDataLike = {
  url: string;
  excerpt?: string | null;
  meta?: {
    title?: string | null;
    description?: string | null;
    image?: string | null;
    imageAlt?: string | null;
    updatedAt?: string | null;
    source?: string | null;
    type?: string | null;
    targetUrl?: string | null;
  } | null;
  sub_results?: SearchResultSubResultLike[] | null;
};

export function isSearchContentType(value: string): value is SearchContentType {
  return (searchContentTypes as readonly string[]).includes(value);
}

export function getSearchContentType(value: string | null | undefined): SearchContentType {
  return value && isSearchContentType(value) ? value : "page";
}

export function selectSearchSubResult(data: SearchResultDataLike): SearchResultSubResultLike | undefined {
  return data.sub_results?.find((subResult) => Boolean(subResult.url || subResult.excerpt));
}

export function selectSearchExcerpt(data: SearchResultDataLike): string | undefined {
  return selectSearchSubResult(data)?.excerpt ?? data.excerpt ?? data.meta?.description ?? undefined;
}

export function selectSearchTargetUrl(data: SearchResultDataLike): string {
  return data.meta?.targetUrl?.trim() || selectSearchSubResult(data)?.url || data.url;
}

export function selectSearchImage(data: SearchResultDataLike): { src: string; alt: string } | undefined {
  const src = data.meta?.image?.trim();

  if (!src) {
    return undefined;
  }

  return {
    src,
    alt: data.meta?.imageAlt?.trim() ?? "",
  };
}

export function formatSearchResultDate(value: string | null | undefined, locale: SiteLocale): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return null;
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    calendar: "gregory",
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isExternalSearchUrl(url: string, currentOrigin: string): boolean {
  try {
    return new URL(url, currentOrigin).origin !== currentOrigin;
  } catch {
    return /^https?:\/\//.test(url);
  }
}
