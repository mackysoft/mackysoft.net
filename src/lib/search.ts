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

export type SearchQueryVariant = {
  value: string;
  strategy: "broad" | "exact";
};

export type RankedSearchResult<TData extends SearchResultDataLike = SearchResultDataLike> = {
  data: TData;
  variantOrder: number;
  resultOrder: number;
  score: number;
};

export type SearchResultMode = "page" | "inline";

type SegmenterPartLike = {
  segment: string;
  isWordLike?: boolean;
};

type SegmenterLike = {
  segment: (input: string) => Iterable<SegmenterPartLike>;
};

type SegmenterFactory = (locale: string, options: Intl.SegmenterOptions) => SegmenterLike | null;

const exactSearchPattern = /^\s*".+"\s*$/u;
const japaneseSearchPattern = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

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

function createDefaultSegmenter(locale: string, options: Intl.SegmenterOptions): SegmenterLike | null {
  if (typeof Intl === "undefined" || typeof Intl.Segmenter === "undefined") {
    return null;
  }

  return new Intl.Segmenter(locale, options);
}

function hasInternalWhitespace(value: string): boolean {
  return /\s/u.test(value);
}

function stripSurroundingQuotes(value: string): string {
  return value.replace(/^\s*"|"\s*$/gu, "").trim();
}

function normalizeSearchText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/gu, "")
    .toLocaleLowerCase();
}

function collectExactSearchSegments(
  query: string,
  createSegmenter: SegmenterFactory,
): string[] {
  const segmenter = createSegmenter("ja", { granularity: "word" });

  if (!segmenter) {
    return [];
  }

  return Array
    .from(segmenter.segment(query))
    .filter((part) => part.segment.trim().length > 0 && part.isWordLike !== false)
    .map((part) => part.segment);
}

export function createSearchQueryVariants(
  rawQuery: string,
  locale: SiteLocale,
  createSegmenter: SegmenterFactory = createDefaultSegmenter,
): SearchQueryVariant[] {
  const query = rawQuery.trim();

  if (!query) {
    return [];
  }

  const variants: SearchQueryVariant[] = [{ value: query, strategy: "broad" }];

  if (
    locale !== "ja"
    || exactSearchPattern.test(query)
    || hasInternalWhitespace(query)
    || !japaneseSearchPattern.test(query)
  ) {
    return variants;
  }

  const segments = collectExactSearchSegments(query, createSegmenter);

  if (segments.length < 2) {
    return variants;
  }

  return [
    {
      value: `"${segments.join(" ")}"`,
      strategy: "exact",
    },
    ...variants,
  ];
}

export function hasExactSearchVariant(variants: SearchQueryVariant[]): boolean {
  return variants.some((variant) => variant.strategy === "exact");
}

export function getSearchMatchPriority(data: SearchResultDataLike, rawQuery: string): number {
  const query = stripSurroundingQuotes(rawQuery);

  if (!query || hasInternalWhitespace(query) || !japaneseSearchPattern.test(query)) {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < 2) {
    return 0;
  }

  const title = normalizeSearchText(data.meta?.title);
  const description = normalizeSearchText(data.meta?.description);
  const excerpt = normalizeSearchText(data.excerpt);
  const subResultTitles = (data.sub_results ?? []).map((subResult) => normalizeSearchText(subResult.title));
  const subResultExcerpts = (data.sub_results ?? []).map((subResult) => normalizeSearchText(subResult.excerpt));

  if (title.includes(normalizedQuery)) {
    return 400;
  }

  if (subResultTitles.some((value) => value.includes(normalizedQuery))) {
    return 300;
  }

  if (excerpt.includes(normalizedQuery) || subResultExcerpts.some((value) => value.includes(normalizedQuery))) {
    return 200;
  }

  if (description.includes(normalizedQuery)) {
    return 100;
  }

  return 0;
}

export function prepareVisibleSearchResults<TData extends SearchResultDataLike>(
  results: RankedSearchResult<TData>[],
  rawQuery: string,
  shouldRerank: boolean,
  mode: SearchResultMode,
): RankedSearchResult<TData>[] {
  const rankedResults = shouldRerank
    ? [...results].sort((left, right) => {
      const priorityDelta = getSearchMatchPriority(right.data, rawQuery) - getSearchMatchPriority(left.data, rawQuery);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      if (left.variantOrder !== right.variantOrder) {
        return left.variantOrder - right.variantOrder;
      }

      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.resultOrder - right.resultOrder;
    })
    : results;

  return mode === "inline"
    ? rankedResults.slice(0, 20)
    : rankedResults;
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
