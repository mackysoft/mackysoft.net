import { defaultLocale, isSiteLocale, supportedLocales, type SiteLocale } from "./i18n";

type TranslationMapEntry = {
  id: string;
  filePath?: string | undefined;
};

type BaseMapEntry = {
  id: string;
};

type TranslationMapOptions = {
  stripPrefix?: string;
};

export type TranslationEntryMap<T> = Map<string, Map<SiteLocale, T>>;

export type LocalizedFallbackState = {
  contentLocale: SiteLocale;
  isFallback: boolean;
  availableLocales: SiteLocale[];
};

function normalizeTranslationPath(id: string, options: TranslationMapOptions = {}) {
  return id.replace(/\\/g, "/").replace(options.stripPrefix ?? "", "");
}

type TranslationIdentifier = {
  slug: string;
  locale: SiteLocale;
};

function extractTranslationIdentifier(id: string, options: TranslationMapOptions = {}): TranslationIdentifier | null {
  const normalizedId = normalizeTranslationPath(id, options);
  const matched = normalizedId.match(/^(.*)\/index\.([a-z-]+)(?:\.(?:md|mdx))?$/);

  if (!matched) {
    return null;
  }

  const [, slug, locale] = matched;

  if (!slug || !isSiteLocale(locale) || locale === defaultLocale) {
    return null;
  }

  return {
    slug,
    locale,
  };
}

export function normalizeTranslationId(id: string, options: TranslationMapOptions = {}) {
  const translationIdentifier = extractTranslationIdentifier(id, options);

  if (translationIdentifier) {
    return translationIdentifier.slug;
  }

  return normalizeTranslationPath(id, options).replace(/\/index(?:\.(?:md|mdx))?$/, "");
}

export function createTranslationMap<T extends TranslationMapEntry>(entries: T[], options: TranslationMapOptions = {}): TranslationEntryMap<T> {
  const translationMap: TranslationEntryMap<T> = new Map();

  for (const entry of entries) {
    const identifiers = new Map<SiteLocale, string>();

    for (const value of [entry.id, entry.filePath].filter((candidate): candidate is string => Boolean(candidate))) {
      const identifier = extractTranslationIdentifier(value, options);

      if (!identifier) {
        continue;
      }

      identifiers.set(identifier.locale, identifier.slug);
    }

    for (const [locale, slug] of identifiers) {
      const localeMap = translationMap.get(slug) ?? new Map<SiteLocale, T>();
      localeMap.set(locale, entry);
      translationMap.set(slug, localeMap);
    }
  }

  return translationMap;
}

export function resolveLocalizedFallbackState(
  requestedLocale: SiteLocale,
  availableLocaleCandidates: Iterable<SiteLocale> = [],
): LocalizedFallbackState {
  const availableLocaleSet = new Set<SiteLocale>([defaultLocale]);

  for (const locale of availableLocaleCandidates) {
    if (isSiteLocale(locale)) {
      availableLocaleSet.add(locale);
    }
  }

  const availableLocales = supportedLocales.filter((locale) => availableLocaleSet.has(locale));
  const contentLocale = availableLocaleSet.has(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    contentLocale,
    isFallback: requestedLocale !== contentLocale,
    availableLocales,
  };
}

export type ResolvedLocalizedEntry<TBase, TTranslation, TData> = {
  slug: string;
  requestedLocale: SiteLocale;
  contentLocale: SiteLocale;
  isFallback: boolean;
  availableLocales: SiteLocale[];
  baseEntry: TBase;
  translationEntry?: TTranslation;
  data: TData;
};

type ResolveLocalizedEntryOptions<TBase extends BaseMapEntry, TTranslation extends TranslationMapEntry, TData> = {
  slug: string;
  locale?: SiteLocale;
  getBaseEntries: () => Promise<TBase[]>;
  getTranslationMap: () => Promise<TranslationEntryMap<TTranslation>>;
  mergeData: (baseEntry: TBase, translationEntry?: TTranslation) => TData;
};

export async function resolveLocalizedEntryBySlug<TBase extends BaseMapEntry, TTranslation extends TranslationMapEntry, TData>({
  slug,
  locale = defaultLocale,
  getBaseEntries,
  getTranslationMap,
  mergeData,
}: ResolveLocalizedEntryOptions<TBase, TTranslation, TData>): Promise<ResolvedLocalizedEntry<TBase, TTranslation, TData> | null> {
  const [baseEntries, translations] = await Promise.all([getBaseEntries(), getTranslationMap()]);
  const baseEntry = baseEntries.find((entry) => entry.id === slug);

  if (!baseEntry) {
    return null;
  }

  const translationsByLocale = translations.get(slug) ?? new Map<SiteLocale, TTranslation>();
  const selectedTranslation = locale === defaultLocale ? undefined : translationsByLocale.get(locale);
  const fallbackState = resolveLocalizedFallbackState(locale, translationsByLocale.keys());

  return {
    slug,
    requestedLocale: locale,
    ...fallbackState,
    baseEntry,
    translationEntry: selectedTranslation,
    data: mergeData(baseEntry, selectedTranslation),
  };
}
