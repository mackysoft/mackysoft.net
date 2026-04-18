import localeDefinitionsData from "../config/locales.json" with { type: "json" };

type LocaleDefinition = {
  code: string;
  pathPrefix: string;
  languageTag: string;
  intlLocale: string;
  browserMatchPrefixes: readonly string[];
};

const localeDefinitions = localeDefinitionsData satisfies Record<string, LocaleDefinition>;

export type SiteLocale = keyof typeof localeDefinitions;
export const defaultLocale = "ja" as const;
export type NonDefaultSiteLocale = Exclude<SiteLocale, typeof defaultLocale>;
export type BrowserLocaleMatcher<TLocale extends string = SiteLocale> = {
  locale: TLocale;
  prefix: string;
};

export const supportedLocales = Object.keys(localeDefinitions) as SiteLocale[];
export const localeStorageKey = "mackysoft-locale";

const localizableContentPathPrefixes = [
  "/",
  "/about/",
  "/archive/",
  "/articles/",
  "/assets/",
  "/contact/",
  "/games/",
  "/privacy-policy/",
  "/tags/",
] as const;

export function getLocaleDefinition(locale: SiteLocale) {
  return localeDefinitions[locale];
}

export function getLocalePathPrefix(locale: SiteLocale) {
  return getLocaleDefinition(locale).pathPrefix;
}

export function getNonDefaultLocales(): NonDefaultSiteLocale[] {
  return supportedLocales.filter((locale): locale is NonDefaultSiteLocale => locale !== defaultLocale);
}

export function isSiteLocale(value: string): value is SiteLocale {
  return Object.hasOwn(localeDefinitions, value);
}

export function normalizePath(pathname: string) {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }

  return pathname;
}

function getLeadingPathSegment(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  return normalizedPath.split("/").filter(Boolean)[0] ?? null;
}

function getLocaleByPathPrefix(pathPrefix: string | null) {
  if (!pathPrefix) {
    return null;
  }

  return supportedLocales.find((locale) => getLocalePathPrefix(locale) === pathPrefix) ?? null;
}

export function getPathLocale(pathname: string): SiteLocale {
  const locale = getLocaleByPathPrefix(getLeadingPathSegment(pathname));
  return locale ?? defaultLocale;
}

export function stripLocaleFromPath(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  const locale = getLocaleByPathPrefix(getLeadingPathSegment(normalizedPath));

  if (!locale || locale === defaultLocale) {
    return normalizedPath;
  }

  const pathPrefix = getLocaleDefinition(locale).pathPrefix;

  if (!pathPrefix) {
    return normalizedPath;
  }

  const strippedPath = normalizedPath.slice(pathPrefix.length + 1);
  return strippedPath.startsWith("/") ? strippedPath || "/" : `/${strippedPath}`;
}

export function localizePath(pathname: string, locale: SiteLocale) {
  const normalizedPath = stripLocaleFromPath(pathname);
  const pathPrefix = getLocalePathPrefix(locale);

  if (!pathPrefix) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return `/${pathPrefix}/`;
  }

  return `/${pathPrefix}${normalizedPath}`;
}

export function switchLocalePath(pathname: string, locale: SiteLocale) {
  return localizePath(pathname, locale);
}

export function createAlternateLocaleLinks(pathname: string, locales: readonly SiteLocale[] = supportedLocales) {
  return locales.map((locale) => ({
    locale,
    path: localizePath(pathname, locale),
  }));
}

export function localizeContentHref(href: string, locale: SiteLocale) {
  if (!href.startsWith("/")) {
    return href;
  }

  if (href.startsWith("//") || href.startsWith("/_astro/")) {
    return href;
  }

  const parsedUrl = new URL(href, "https://mackysoft.net");
  const normalizedPathname = normalizePath(parsedUrl.pathname);
  const shouldLocalize = localizableContentPathPrefixes.some((prefix) => {
    if (prefix === "/") {
      return normalizedPathname === "/";
    }

    return normalizedPathname === prefix.slice(0, -1) || normalizedPathname.startsWith(prefix);
  });

  if (!shouldLocalize) {
    return href;
  }

  return `${localizePath(normalizedPathname, locale)}${parsedUrl.search}${parsedUrl.hash}`;
}

function normalizeBrowserLocaleCandidate(candidate: string) {
  return candidate.trim().toLowerCase().replaceAll("_", "-");
}

export function sortBrowserLocaleMatchers<TLocale extends string>(matchers: readonly BrowserLocaleMatcher<TLocale>[]) {
  return [...matchers].sort((left, right) => {
    const prefixLengthDifference = right.prefix.length - left.prefix.length;

    if (prefixLengthDifference !== 0) {
      return prefixLengthDifference;
    }

    return left.prefix.localeCompare(right.prefix);
  });
}

export function matchBrowserLocaleCandidate<TLocale extends string>(
  candidate: string,
  matchers: readonly BrowserLocaleMatcher<TLocale>[],
): TLocale | null {
  const normalizedCandidate = normalizeBrowserLocaleCandidate(candidate);

  for (const matcher of matchers) {
    if (normalizedCandidate === matcher.prefix || normalizedCandidate.startsWith(`${matcher.prefix}-`)) {
      return matcher.locale;
    }
  }

  return null;
}

const browserLocaleMatchers = sortBrowserLocaleMatchers(
  supportedLocales.flatMap((locale) =>
    getLocaleDefinition(locale).browserMatchPrefixes.map((prefix) => ({
      locale,
      prefix: normalizeBrowserLocaleCandidate(prefix),
    })),
  ),
);

export function getBrowserLocaleMatchers() {
  return browserLocaleMatchers;
}

export function getLocalePreference(candidates: readonly string[] | null | undefined): SiteLocale {
  if (!candidates) {
    return defaultLocale;
  }

  for (const candidate of candidates) {
    const matchedLocale = matchBrowserLocaleCandidate(candidate, browserLocaleMatchers);

    if (matchedLocale) {
      return matchedLocale;
    }
  }

  return defaultLocale;
}

export function toLanguageTag(locale: SiteLocale) {
  return getLocaleDefinition(locale).languageTag;
}

export function getIntlLocale(locale: SiteLocale) {
  return getLocaleDefinition(locale).intlLocale;
}
