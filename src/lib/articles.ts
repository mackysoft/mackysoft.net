import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";

import activityData from "../generated/activity.json";
import { resolveLocalArticleCardImage, type SocialImage } from "../features/site/social-image";
import { defaultLocale, localizePath, supportedLocales, type SiteLocale } from "./i18n";
import {
  createTranslationMap,
  type TranslationEntryMap,
  resolveLocalizedEntryBySlug,
} from "./localized-entry";
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

type LocalizedArticleActivityMap = Record<typeof defaultLocale, LocalizedArticleActivity>
  & Partial<Record<SiteLocale, LocalizedArticleActivity>>;

export type ArticleActivity = {
  id: string;
  source: string;
  publishedAt: string;
  locales: LocalizedArticleActivityMap;
};

type ArticleActivityData = {
  articles: ArticleActivity[];
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
  cover?: ArticleCardCover;
  contentLocale: SiteLocale;
  isFallback: boolean;
};

export type ArticleCardCover =
  | {
    kind: "generated";
    src: string;
    alt: string;
    width: number;
    height: number;
  }
  | {
    kind: "remote";
    src: string;
    alt: string;
  }
  | {
    kind: "local";
    src: ImageMetadata;
    alt: string;
    width: number;
    height: number;
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

const activity = activityData as unknown as ArticleActivityData;

let localArticlesPromise: Promise<ArticleEntry[]> | undefined;
let articleTranslationsPromise: Promise<TranslationEntryMap<ArticleTranslationEntry>> | undefined;

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

function getExternalArticleLocaleFallbackOrder(locale: SiteLocale): SiteLocale[] {
  if (locale === "zh-hant") {
    return ["zh-hant", "en", defaultLocale];
  }

  return [locale, defaultLocale];
}

function getArticleVariant(article: ArticleActivity, locale: SiteLocale) {
  const availableLocaleSet = new Set(Object.keys(article.locales) as SiteLocale[]);
  const contentLocale = getExternalArticleLocaleFallbackOrder(locale).find((candidate) => availableLocaleSet.has(candidate)) ?? defaultLocale;
  const variant = article.locales[contentLocale] ?? article.locales[defaultLocale];

  return {
    variant,
    contentLocale,
    isFallback: locale !== contentLocale,
    availableLocales: supportedLocales.filter((candidate) => availableLocaleSet.has(candidate)),
  };
}

async function getArticleTranslationMap() {
  if (!articleTranslationsPromise) {
    articleTranslationsPromise = (async () => {
      const { getCollection } = await import("astro:content");
      const entries = await getCollection("articleTranslations", ({ data }) => !data.draft);
      return createTranslationMap(entries, { stripPrefix: "src/content/articles/" });
    })();
  }

  return articleTranslationsPromise;
}

export function sortArticleItems(articleItems: ArticleItem[]) {
  return articleItems.sort((left, right) => right.publishedAt.valueOf() - left.publishedAt.valueOf());
}

function createRemoteArticleCardCover(src: string, alt?: string): ArticleCardCover {
  return {
    kind: "remote",
    src,
    alt: alt ?? "",
  };
}

function createLocalArticleCardCover(image: { src: ImageMetadata; alt: string; width: number; height: number }): ArticleCardCover {
  return {
    kind: "local",
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
  };
}

function createGeneratedArticleCardCover(image: { src: string; alt: string; width: number; height: number }): ArticleCardCover {
  return {
    kind: "generated",
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
  };
}

function createArticleCardCover(image: SocialImage): ArticleCardCover {
  const { src, alt, width, height } = image;

  if (typeof src === "string") {
    return createGeneratedArticleCardCover({ src, alt, width, height });
  }

  return createLocalArticleCardCover({ src, alt, width, height });
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
    cover: variant.coverUrl ? createRemoteArticleCardCover(variant.coverUrl, variant.coverAlt) : undefined,
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
  const localizedEntry = await resolveLocalizedEntryBySlug({
    slug,
    locale,
    getBaseEntries: getLocalArticles,
    getTranslationMap: getArticleTranslationMap,
    mergeData: mergeArticleData,
  });

  if (!localizedEntry) {
    return null;
  }

  const { baseEntry, translationEntry, data, ...localeState } = localizedEntry;

  return {
    ...localeState,
    entry: translationEntry ?? baseEntry,
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
  const socialImage = resolveLocalArticleCardImage({
    slug: article.slug,
    title: article.data.title,
    contentLocale: article.contentLocale,
    cover: article.data.cover,
    coverAlt: article.data.coverAlt,
  });

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
    cover: createArticleCardCover(socialImage),
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
