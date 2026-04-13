import { getContentYear, getContentYearMonth } from "../content-date";
import { localizePath, type SiteLocale } from "../i18n";
import { createTranslationMap } from "../localized-entry";
import { toAbsoluteSiteUrl } from "../site-url.mjs";

type TranslationMapEntry = {
  id: string;
  filePath?: string;
};

type PublicDetailRoute = {
  slug: string;
  lastmod?: Date;
  hasEnglishVersion: boolean;
};

type PublicPageRoute = {
  slug: string;
  hasEnglishVersion: boolean;
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
  "/contact/",
  "/games/",
  "/search/",
] as const;

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
  pushUrlEntry(entries, seenLocations, site, localizePath(path, "en"));
}

function addLocalizedContentPageEntries(
  entries: PublicUrlEntry[],
  seenLocations: Set<string>,
  site: URL,
  contentPages: readonly PublicPageRoute[],
) {
  for (const page of sortBySlug(contentPages)) {
    const path = `/${page.slug}/`;
    pushUrlEntry(entries, seenLocations, site, path);

    if (page.hasEnglishVersion) {
      pushUrlEntry(entries, seenLocations, site, localizePath(path, "en"));
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

    if (detail.hasEnglishVersion) {
      pushUrlEntry(entries, seenLocations, site, localizePath(path, "en"), detail.lastmod);
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
    pushUrlEntry(entries, seenLocations, site, localizePath(path, "en"));
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

  const englishArticleSlugs = getTranslatedSlugSet(articleTranslations, "src/content/articles/", "en");
  const englishGameSlugs = getTranslatedSlugSet(gameTranslations, "src/content/games/", "en");
  const englishPageSlugs = getTranslatedSlugSet(pageTranslations, "src/content/pages/", "en");

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
      hasEnglishVersion: englishArticleSlugs.has(article.id),
    })),
    gameDetails: games.map((game) => ({
      slug: game.id,
      lastmod: game.data.updatedAt ?? game.data.publishedAt,
      hasEnglishVersion: englishGameSlugs.has(game.id),
    })),
    contentPages: pages.map((page) => ({
      slug: page.id,
      hasEnglishVersion: englishPageSlugs.has(page.id),
    })),
    tagPaths,
    archivePaths,
  });
}
