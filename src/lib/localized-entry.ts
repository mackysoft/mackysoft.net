import { defaultLocale, type SiteLocale } from "./i18n";

type TranslationMapEntry = {
  id: string;
  filePath?: string | undefined;
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
