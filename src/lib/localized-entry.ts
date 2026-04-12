import { defaultLocale, type SiteLocale } from "./i18n";

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

export type LocalizedFallbackState = {
  contentLocale: SiteLocale;
  isFallback: boolean;
  availableLocales: SiteLocale[];
};

export function normalizeTranslationId(id: string, options: TranslationMapOptions = {}) {
  return id
    .replace(/\\/g, "/")
    .replace(options.stripPrefix ?? "", "")
    .replace(/\/index(?:\.[a-z-]+)?(?:\.(?:md|mdx))?$/, "");
}

export function createTranslationMap<T extends TranslationMapEntry>(entries: T[], options: TranslationMapOptions = {}) {
  return new Map(
    entries.flatMap((entry) => {
      const candidateKeys = new Set([
        normalizeTranslationId(entry.id, options),
        entry.filePath ? normalizeTranslationId(entry.filePath, options) : null,
      ]);

      return [...candidateKeys]
        .filter((key): key is string => Boolean(key))
        .map((key) => [key, entry] as const);
    }),
  );
}

export function resolveLocalizedFallbackState(
  requestedLocale: SiteLocale,
  hasTranslation: boolean,
  translationLocale: SiteLocale = "en",
): LocalizedFallbackState {
  const contentLocale = requestedLocale === translationLocale && hasTranslation ? translationLocale : defaultLocale;

  return {
    contentLocale,
    isFallback: requestedLocale !== contentLocale,
  availableLocales: hasTranslation ? [defaultLocale, translationLocale] : [defaultLocale],
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
  getTranslationMap: () => Promise<Map<string, TTranslation>>;
  mergeData: (baseEntry: TBase, translationEntry?: TTranslation) => TData;
  translationLocale?: SiteLocale;
};

export async function resolveLocalizedEntryBySlug<TBase extends BaseMapEntry, TTranslation extends TranslationMapEntry, TData>({
  slug,
  locale = defaultLocale,
  getBaseEntries,
  getTranslationMap,
  mergeData,
  translationLocale = "en",
}: ResolveLocalizedEntryOptions<TBase, TTranslation, TData>): Promise<ResolvedLocalizedEntry<TBase, TTranslation, TData> | null> {
  const [baseEntries, translations] = await Promise.all([getBaseEntries(), getTranslationMap()]);
  const baseEntry = baseEntries.find((entry) => entry.id === slug);

  if (!baseEntry) {
    return null;
  }

  const translationEntry = translations.get(slug);
  const selectedTranslation = locale === translationLocale ? translationEntry : undefined;
  const fallbackState = resolveLocalizedFallbackState(locale, Boolean(selectedTranslation), translationLocale);

  return {
    slug,
    requestedLocale: locale,
    ...fallbackState,
    baseEntry,
    translationEntry: selectedTranslation,
    data: mergeData(baseEntry, selectedTranslation),
  };
}
