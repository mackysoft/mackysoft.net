export const supportedLocales = ["ja", "en"] as const;

export type SiteLocale = (typeof supportedLocales)[number];

export const defaultLocale: SiteLocale = "ja";
export const localeStorageKey = "mackysoft-locale";

export function isSiteLocale(value: string): value is SiteLocale {
  return supportedLocales.includes(value as SiteLocale);
}

export function normalizePath(pathname: string) {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname;
}

export function getPathLocale(pathname: string): SiteLocale {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/en" || normalizedPath.startsWith("/en/")) {
    return "en";
  }

  return defaultLocale;
}

export function stripLocaleFromPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath === "/en") {
    return "/";
  }

  if (normalizedPath.startsWith("/en/")) {
    return normalizedPath.slice(3);
  }

  return normalizedPath;
}

export function localizePath(pathname: string, locale: SiteLocale) {
  const normalizedPath = stripLocaleFromPath(pathname);

  if (locale === defaultLocale) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return `/${locale}/`;
  }

  return `/${locale}${normalizedPath}`;
}

export function switchLocalePath(pathname: string, locale: SiteLocale) {
  return localizePath(pathname, locale);
}

export function getLocalePreference(candidates: readonly string[] | null | undefined): SiteLocale {
  if (!candidates) {
    return defaultLocale;
  }

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase();

    if (normalizedCandidate === "en" || normalizedCandidate.startsWith("en-")) {
      return "en";
    }

    if (normalizedCandidate === "ja" || normalizedCandidate.startsWith("ja-")) {
      return "ja";
    }
  }

  return defaultLocale;
}

export function toLanguageTag(locale: SiteLocale) {
  return locale;
}

