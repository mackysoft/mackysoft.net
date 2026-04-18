import { getContentYear, getContentYearMonth } from "../content-date";
import { getNonDefaultLocales, localizePath, type SiteLocale } from "../i18n";
import { createTranslationMap } from "../localized-entry";
import { toAbsoluteSiteUrl } from "../site-url.mjs";

type TranslationMapEntry = {
  id: string;
  filePath?: string;
};

type PublicDetailRoute = {
  slug: string;
  lastmod?: Date;
  localizedLocales: SiteLocale[];
};

type PublicPageRoute = {
  slug: string;
  localizedLocales: SiteLocale[];
};

export type PublicUrlEntry = {
  loc: string;
  lastmod?: Date;
};

export type SitemapBuildInput = {
  articleDetails: readonly PublicDetailRoute[];
  gameDetails: readonly PublicDetailRoute[];
  contentPages: readonly PublicPageRoute[];
  tagPaths: readonly string[];
  archivePaths: readonly string[];
};

const publicStaticPaths = [
  "/",
  "/about/",
  "/articles/",
  "/assets/",
  "/games/",
] as const;
const nonIndexablePageSlugs = new Set(["privacy-policy"]);
const publicNonDefaultLocales = getNonDefaultLocales();

function sortBySlug<T extends { slug: string }>(entries: readonly T[]) {
  return [...entries].sort((left, right) => left.slug.localeCompare(right.slug, "ja"));
}

function sortPaths(paths: readonly string[]) {
  return [...paths].sort((left, right) => left.localeCompare(right, "ja"));
}

function pushUrlEntry(
  entries: PublicUrlEntry[],
  seenLocations: Set<string>,
  site: URL,
  path: string,
  lastmod?: Date,
) {
  const loc = toAbsoluteSiteUrl(site, path);

  if (seenLocations.has(loc)) {
    return;
  }

  seenLocations.add(loc);
  entries.push(lastmod ? { loc, lastmod } : { loc });
}

function addLocalizedIndexPathEntries(entries: PublicUrlEntry[], seenLocations: Set<string>, site: URL, path: string) {
  pushUrlEntry(entries, seenLocations, site, path);

  for (const locale of publicNonDefaultLocales) {
    pushUrlEntry(entries, seenLocations, site, localizePath(path, locale));
  }
}

function addLocalizedContentPageEntries(
  entries: PublicUrlEntry[],
  seenLocations: Set<string>,
  site: URL,
  contentPages: readonly PublicPageRoute[],
) {
  for (const page of sortBySlug(contentPages)) {
    if (nonIndexablePageSlugs.has(page.slug)) {
      continue;
    }

    const path = `/${page.slug}/`;
    pushUrlEntry(entries, seenLocations, site, path);

    for (const locale of page.localizedLocales) {
      pushUrlEntry(entries, seenLocations, site, localizePath(path, locale));
    }
  }
}

function addLocalizedDetailEntries(
  entries: PublicUrlEntry[],
  seenLocations: Set<string>,
  site: URL,
  prefix: string,
  detailRoutes: readonly PublicDetailRoute[],
) {
  for (const detail of sortBySlug(detailRoutes)) {
    const path = `${prefix}${detail.slug}/`;
    pushUrlEntry(entries, seenLocations, site, path, detail.lastmod);

    for (const locale of detail.localizedLocales) {
      pushUrlEntry(entries, seenLocations, site, localizePath(path, locale), detail.lastmod);
    }
  }
}

function addLocalizedPathEntries(
  entries: PublicUrlEntry[],
  seenLocations: Set<string>,
  site: URL,
  paths: readonly string[],
) {
  for (const path of sortPaths(paths)) {
    pushUrlEntry(entries, seenLocations, site, path);

    for (const locale of publicNonDefaultLocales) {
      pushUrlEntry(entries, seenLocations, site, localizePath(path, locale));
    }
  }
}

export function buildSitemapEntries(site: URL, input: SitemapBuildInput): PublicUrlEntry[] {
  const entries: PublicUrlEntry[] = [];
  const seenLocations = new Set<string>();

  for (const path of publicStaticPaths) {
    addLocalizedIndexPathEntries(entries, seenLocations, site, path);
  }

  addLocalizedContentPageEntries(entries, seenLocations, site, input.contentPages);
  addLocalizedDetailEntries(entries, seenLocations, site, "/articles/", input.articleDetails);
  addLocalizedDetailEntries(entries, seenLocations, site, "/games/", input.gameDetails);
  addLocalizedPathEntries(entries, seenLocations, site, input.tagPaths);
  addLocalizedPathEntries(entries, seenLocations, site, input.archivePaths);

  return entries;
}

export function renderSitemapXml(entries: readonly PublicUrlEntry[]) {
  const xmlLines = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    ...entries.flatMap((entry) => [
      "  <url>",
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      ...(entry.lastmod ? [`    <lastmod>${entry.lastmod.toISOString()}</lastmod>`] : []),
      "  </url>",
    ]),
    "</urlset>",
  ];

  return `${xmlLines.join("\n")}\n`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function getTranslatedSlugSet<T extends TranslationMapEntry>(
  entries: readonly T[],
  stripPrefix: string,
  locale: SiteLocale,
) {
  const translationMap = createTranslationMap([...entries], { stripPrefix });

  return new Set(
    Array.from(translationMap.entries())
      .filter(([, translations]) => translations.has(locale))
      .map(([slug]) => slug),
  );
}

export async function getPublicUrlEntries(site: URL) {
  const { getCollection } = await import("astro:content");
  const [{ getLocalArticles }, { getGames }, { getPages }] = await Promise.all([
    import("../articles"),
    import("../game-repository"),
    import("../pages"),
  ]);

  const [articles, games, pages, articleTranslations, gameTranslations, pageTranslations] = await Promise.all([
    getLocalArticles(),
    getGames(),
    getPages(),
    getCollection("articleTranslations", ({ data }) => !data.draft),
    getCollection("gameTranslations", ({ data }) => !data.draft),
    getCollection("pageTranslations", ({ data }) => !data.draft),
  ]);

  const translatedArticleSlugsByLocale = new Map(
    publicNonDefaultLocales.map((locale) => [locale, getTranslatedSlugSet(articleTranslations, "src/content/articles/", locale)]),
  );
  const translatedGameSlugsByLocale = new Map(
    publicNonDefaultLocales.map((locale) => [locale, getTranslatedSlugSet(gameTranslations, "src/content/games/", locale)]),
  );
  const translatedPageSlugsByLocale = new Map(
    publicNonDefaultLocales.map((locale) => [locale, getTranslatedSlugSet(pageTranslations, "src/content/pages/", locale)]),
  );

  const tagPaths = Array.from(new Set(articles.flatMap((article) => article.data.tags))).map((tag) => `/tags/${tag}/`);
  const archivePaths = Array.from(
    new Set(
      articles.flatMap((article) => {
        const year = getContentYear(article.data.publishedAt);
        const { month } = getContentYearMonth(article.data.publishedAt);
        return [`/archive/${year}/`, `/archive/${year}/${month}/`];
      }),
    ),
  );

  return buildSitemapEntries(site, {
    articleDetails: articles.map((article) => ({
      slug: article.id,
      lastmod: article.data.updatedAt ?? article.data.publishedAt,
      localizedLocales: publicNonDefaultLocales.filter((locale) => translatedArticleSlugsByLocale.get(locale)?.has(article.id)),
    })),
    gameDetails: games.map((game) => ({
      slug: game.id,
      lastmod: game.data.updatedAt ?? game.data.publishedAt,
      localizedLocales: publicNonDefaultLocales.filter((locale) => translatedGameSlugsByLocale.get(locale)?.has(game.id)),
    })),
    contentPages: pages.map((page) => ({
      slug: page.id,
      localizedLocales: publicNonDefaultLocales.filter((locale) => translatedPageSlugsByLocale.get(locale)?.has(page.id)),
    })),
    tagPaths,
    archivePaths,
  });
}
