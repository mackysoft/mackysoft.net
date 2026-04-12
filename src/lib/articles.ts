import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";

import activityData from "../generated/activity.json";
import { defaultLocale, localizePath, type SiteLocale } from "./i18n";
import { getSiteMeta } from "./site";

export type ArticleEntry = CollectionEntry<"articles">;
export type ArticleTranslationEntry = CollectionEntry<"articleTranslations">;

export type LocalizedArticleActivity = {
  title: string;
  description: string;
  url: string;
  coverUrl?: string;
  coverAlt?: string;
};

export type ArticleActivity = {
  id: string;
  source: string;
  publishedAt: string;
  locales: {
    ja: LocalizedArticleActivity;
    en?: LocalizedArticleActivity;
  };
};

export type ReleaseActivity = {
  groupId: string;
  source: string;
  repo: string;
  description: string;
  license: string;
  stargazerCount: number;
  name: string;
  version: string;
  url: string;
  publishedAt: string;
  coverUrl: string;
  coverAlt: string;
};

export type ActivityData = {
  articles: ArticleActivity[];
  releases: ReleaseActivity[];
};

export type ArticleItem = {
  id: string;
  kind: "local" | "external";
  title: string;
  description: string;
  href: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  source: string;
  cover?: ImageMetadata | string;
  coverAlt?: string;
  contentLocale: SiteLocale;
  isFallback: boolean;
};

export type LocalizedArticleEntry = {
  slug: string;
  requestedLocale: SiteLocale;
  contentLocale: SiteLocale;
  isFallback: boolean;
  availableLocales: SiteLocale[];
  entry: ArticleEntry | ArticleTranslationEntry;
  baseEntry: ArticleEntry;
  data: {
    title: string;
    description: string;
    publishedAt: Date;
    updatedAt?: Date;
    tags: string[];
    cover?: ImageMetadata;
    coverAlt?: string;
  };
  href: string;
};

const activity = activityData as unknown as ActivityData;
const releaseStarCountFormatterMap: Record<SiteLocale, Intl.NumberFormat> = {
  ja: new Intl.NumberFormat("ja-JP"),
  en: new Intl.NumberFormat("en-US"),
};

let localArticlesPromise: Promise<ArticleEntry[]> | undefined;
let articleTranslationsPromise: Promise<Map<string, ArticleTranslationEntry>> | undefined;

function normalizeTranslationId(id: string) {
  return id.replace(/\/index\.[a-z-]+$/, "");
}

function mergeArticleData(baseEntry: ArticleEntry, translationEntry?: ArticleTranslationEntry) {
  return {
    title: translationEntry?.data.title ?? baseEntry.data.title,
    description: translationEntry?.data.description ?? baseEntry.data.description,
    publishedAt: baseEntry.data.publishedAt,
    updatedAt: baseEntry.data.updatedAt,
    tags: baseEntry.data.tags,
    cover: translationEntry?.data.cover ?? baseEntry.data.cover,
    coverAlt: translationEntry?.data.coverAlt ?? baseEntry.data.coverAlt,
  };
}

function getArticleVariant(article: ArticleActivity, locale: SiteLocale) {
  const variant = article.locales[locale] ?? article.locales.ja;
  const contentLocale = article.locales[locale] ? locale : defaultLocale;

  return {
    variant,
    contentLocale,
    isFallback: locale !== contentLocale,
  };
}

async function getArticleTranslationMap() {
  if (!articleTranslationsPromise) {
    articleTranslationsPromise = (async () => {
      const { getCollection } = await import("astro:content");
      const entries = await getCollection("articleTranslations", ({ data }) => !data.draft);
      return new Map(entries.map((entry) => [normalizeTranslationId(entry.id), entry]));
    })();
  }

  return articleTranslationsPromise;
}

export function sortArticleItems(articleItems: ArticleItem[]) {
  return articleItems.sort((left, right) => right.publishedAt.valueOf() - left.publishedAt.valueOf());
}

export function sortReleaseActivities(releases: ReleaseActivity[]) {
  return releases.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function getLatestReleaseActivities(releases: ReleaseActivity[], limit = 3) {
  return sortReleaseActivities([...releases]).slice(0, limit);
}

export function getReleaseActivities() {
  return sortReleaseActivities([...activity.releases]);
}

export function getReleaseRepoName(repo: string) {
  return repo.split("/").at(-1) ?? repo;
}

export function formatReleaseStargazerCount(stargazerCount: number, locale: SiteLocale = defaultLocale) {
  return releaseStarCountFormatterMap[locale].format(stargazerCount);
}

export function toExternalArticleItem(article: ArticleActivity, locale: SiteLocale = defaultLocale): ArticleItem {
  const { variant, contentLocale, isFallback } = getArticleVariant(article, locale);

  return {
    id: article.id,
    kind: "external",
    title: variant.title,
    description: variant.description,
    href: variant.url,
    publishedAt: new Date(article.publishedAt),
    tags: [],
    source: article.source,
    cover: variant.coverUrl,
    coverAlt: variant.coverAlt,
    contentLocale,
    isFallback,
  };
}

export async function getLocalArticles() {
  if (!localArticlesPromise) {
    localArticlesPromise = (async () => {
      const { getCollection } = await import("astro:content");
      const articles = await getCollection("articles", ({ data }) => !data.draft);
      return articles.sort((left, right) => right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf());
    })();
  }

  return localArticlesPromise;
}

export async function resolveLocalizedArticleBySlug(slug: string, locale: SiteLocale = defaultLocale): Promise<LocalizedArticleEntry | null> {
  const [articles, translations] = await Promise.all([getLocalArticles(), getArticleTranslationMap()]);
  const baseEntry = articles.find((article) => article.id === slug);

  if (!baseEntry) {
    return null;
  }

  const translationEntry = translations.get(slug);
  const selectedTranslation = locale === "en" ? translationEntry : undefined;
  const data = mergeArticleData(baseEntry, selectedTranslation);
  const contentLocale: SiteLocale = selectedTranslation ? "en" : "ja";

  return {
    slug,
    requestedLocale: locale,
    contentLocale,
    isFallback: locale !== contentLocale,
    availableLocales: translationEntry ? ["ja", "en"] : ["ja"],
    entry: selectedTranslation ?? baseEntry,
    baseEntry,
    data,
    href: localizePath(`/articles/${slug}/`, locale),
  };
}

export async function getLocalizedLocalArticles(locale: SiteLocale = defaultLocale) {
  const articles = await getLocalArticles();
  return Promise.all(articles.map((article) => resolveLocalizedArticleBySlug(article.id, locale))) as Promise<Array<LocalizedArticleEntry | null>>;
}

export function toLocalizedLocalArticleItem(article: LocalizedArticleEntry): ArticleItem {
  return {
    id: article.slug,
    kind: "local",
    title: article.data.title,
    description: article.data.description,
    href: article.href,
    publishedAt: article.data.publishedAt,
    updatedAt: article.data.updatedAt,
    tags: article.data.tags,
    source: getSiteMeta(defaultLocale).name,
    cover: article.data.cover,
    coverAlt: article.data.coverAlt,
    contentLocale: article.contentLocale,
    isFallback: article.isFallback,
  };
}

export async function toLocalArticleItem(article: ArticleEntry, locale: SiteLocale = defaultLocale) {
  const localizedArticle = await resolveLocalizedArticleBySlug(article.id, locale);

  if (!localizedArticle) {
    throw new Error(`Unknown local article slug: ${article.id}`);
  }

  return toLocalizedLocalArticleItem(localizedArticle);
}

export async function getArticleItems(locale: SiteLocale = defaultLocale) {
  const [localArticles] = await Promise.all([getLocalArticles()]);
  const localItems = await Promise.all(localArticles.map((article) => toLocalArticleItem(article, locale)));
  const externalArticles = activity.articles.map((article) => toExternalArticleItem(article, locale));
  return sortArticleItems([...localItems, ...externalArticles]);
}

export function getLatestReleases(limit = 3) {
  return getReleaseActivities().slice(0, limit);
}
