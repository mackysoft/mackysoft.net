import { getLocalePathPrefix, getNonDefaultLocales, type NonDefaultSiteLocale } from "./i18n";

type StaticPath<Props extends Record<string, unknown> = Record<string, unknown>> = {
  params?: Record<string, string | number>;
  props?: Props;
};

function getNonDefaultLocaleRouteParam(locale: NonDefaultSiteLocale) {
  const pathPrefix = getLocalePathPrefix(locale);

  if (!pathPrefix) {
    throw new Error(`Locale "${locale}" must define a non-empty pathPrefix for prefixed routes.`);
  }

  return pathPrefix;
}

export function getNonDefaultLocaleStaticPaths() {
  return getNonDefaultLocales().map((locale) => ({
    params: { locale: getNonDefaultLocaleRouteParam(locale) },
  }));
}

export function mapPrefixedLocaleStaticPaths<Props extends Record<string, unknown> = Record<string, unknown>>(
  staticPaths: StaticPath<Props>[],
) {
  return staticPaths.flatMap((entry) =>
    getNonDefaultLocales().map((locale) => ({
      params: {
        locale: getNonDefaultLocaleRouteParam(locale),
        ...entry.params,
      },
      ...(entry.props ? { props: entry.props } : {}),
    })),
  );
}
