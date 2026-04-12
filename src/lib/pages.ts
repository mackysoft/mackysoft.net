import type { CollectionEntry } from "astro:content";

import { defaultLocale, localizePath, type SiteLocale } from "./i18n";
import {
  createTranslationMap,
  type TranslationEntryMap,
  resolveLocalizedEntryBySlug,
} from "./localized-entry";

export type PageEntry = CollectionEntry<"pages">;
export type PageTranslationEntry = CollectionEntry<"pageTranslations">;

export type LocalizedPageEntry = {
  slug: string;
  requestedLocale: SiteLocale;
  contentLocale: SiteLocale;
  isFallback: boolean;
  availableLocales: SiteLocale[];
  entry: PageEntry | PageTranslationEntry;
  baseEntry: PageEntry;
  data: {
    title: string;
    description: string;
  };
  href: string;
};

let pagesPromise: Promise<PageEntry[]> | undefined;
let pageTranslationsPromise: Promise<TranslationEntryMap<PageTranslationEntry>> | undefined;

function mergePageData(baseEntry: PageEntry, translationEntry?: PageTranslationEntry) {
  return {
    title: translationEntry?.data.title ?? baseEntry.data.title,
    description: translationEntry?.data.description ?? baseEntry.data.description,
  };
}

async function getPageTranslationMap() {
  if (!pageTranslationsPromise) {
    pageTranslationsPromise = (async () => {
      const { getCollection } = await import("astro:content");
      const entries = await getCollection("pageTranslations", ({ data }) => !data.draft);
      return createTranslationMap(entries, { stripPrefix: "src/content/pages/" });
    })();
  }

  return pageTranslationsPromise;
}

export async function getPages() {
  if (!pagesPromise) {
    pagesPromise = (async () => {
      const { getCollection } = await import("astro:content");
      return getCollection("pages", ({ data }) => !data.draft);
    })();
  }

  return pagesPromise;
}

export async function resolveLocalizedPageBySlug(slug: string, locale: SiteLocale = defaultLocale): Promise<LocalizedPageEntry | null> {
  const localizedEntry = await resolveLocalizedEntryBySlug({
    slug,
    locale,
    getBaseEntries: getPages,
    getTranslationMap: getPageTranslationMap,
    mergeData: mergePageData,
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
    href: localizePath(`/${slug}/`, locale),
  };
}
