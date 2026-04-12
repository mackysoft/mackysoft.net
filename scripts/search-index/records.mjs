import {
  fetchZennArticleHtml,
  parseZennArticlePage,
} from "../activity-sync/zenn.mjs";
import { normalizeWhitespace } from "../activity-sync/shared.mjs";
import localeDefinitions from "../../src/config/locales.json" with { type: "json" };

const searchRecordLanguages = Object.keys(localeDefinitions);

function createSearchContent(parts) {
  return normalizeWhitespace(parts.filter(Boolean).join("\n\n"));
}

function createSyntheticSearchRecordUrl(kind, id, language) {
  return `/__search-index/${kind}/${language}/${encodeURIComponent(id)}/`;
}

function splitSearchTerms(value) {
  const normalized = normalizeWhitespace(
    value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[^\p{L}\p{N}]+/gu, " "),
  );

  return normalized ? normalized.split(" ") : [];
}

function createCompoundSearchTerms(terms) {
  const compounds = [];

  for (let start = 0; start < terms.length; start += 1) {
    let compound = terms[start];

    for (let end = start + 1; end < Math.min(terms.length, start + 4); end += 1) {
      compound += terms[end];
      compounds.push(compound);
    }
  }

  return compounds;
}

function createSearchAliases(...values) {
  const terms = values.flatMap((value) => splitSearchTerms(value)).filter(Boolean);
  return [...new Set([
    terms.join(" "),
    ...createCompoundSearchTerms(terms),
  ].filter(Boolean))];
}

function createSearchMeta({
  title,
  type,
  description,
  image,
  imageAlt,
  updatedAt,
  source,
  targetUrl,
  tags = [],
}) {
  return {
    title,
    type,
    description,
    ...(image ? { image } : {}),
    ...(imageAlt ? { imageAlt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    ...(source ? { source } : {}),
    ...(targetUrl ? { targetUrl } : {}),
    ...(tags.length > 0 ? { tags: tags.join(", ") } : {}),
  };
}

function createSearchFilters(type, tags = []) {
  return {
    type: [type],
    ...(tags.length > 0 ? { tags } : {}),
  };
}

function createSearchRecord({
  url,
  language,
  title,
  type,
  description,
  source,
  updatedAt,
  image,
  imageAlt,
  targetUrl,
  tags = [],
  content,
}) {
  return {
    url,
    language,
    content: createSearchContent([title, description, content]),
    meta: createSearchMeta({
      title,
      type,
      description,
      image,
      imageAlt,
      updatedAt,
      source,
      targetUrl,
      tags,
    }),
    filters: createSearchFilters(type, tags),
  };
}

async function resolveExternalArticleContent(article, locale, fetchImpl = fetch) {
  const localizedArticle = article.locales[locale];

  if (!localizedArticle) {
    return null;
  }

  let content = localizedArticle.description;
  let image = localizedArticle.coverUrl;
  let imageAlt = localizedArticle.coverAlt;

  if (article.source === "Zenn") {
    try {
      const html = await fetchZennArticleHtml(article.locales.ja.url, locale, fetchImpl);
      const localizedPage = parseZennArticlePage(html);
      content = localizedPage.content || localizedPage.description || localizedArticle.description;
      image = localizedPage.coverUrl ?? image;
      imageAlt = localizedPage.coverAlt ?? imageAlt;
    } catch (error) {
      console.warn(`Failed to fetch ${article.source} article body for ${article.id} (${locale}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    title: localizedArticle.title,
    description: localizedArticle.description,
    url: localizedArticle.url,
    updatedAt: article.publishedAt,
    source: article.source,
    image,
    imageAlt,
    content,
  };
}

export async function createExternalArticleSearchRecord(article, locale, fetchImpl = fetch) {
  const localizedContent = await resolveExternalArticleContent(article, locale, fetchImpl);

  if (!localizedContent) {
    return null;
  }

  return createSearchRecord({
    ...localizedContent,
    language: locale,
    type: "article",
  });
}

export async function createExternalArticleSearchRecords(articles, fetchImpl = fetch) {
  const records = await Promise.all(
    articles.flatMap((article) =>
      Object.keys(article.locales).map((locale) => createExternalArticleSearchRecord(article, locale, fetchImpl)),
    ),
  );

  return records.filter(Boolean);
}

function getReleaseRepoName(repo) {
  return repo.split("/").at(-1) ?? repo;
}

export function createReleaseSearchRecords(releases) {
  return releases.flatMap((release) => {
    const title = getReleaseRepoName(release.repo);
    const aliasTerms = createSearchAliases(release.repo, title, release.name ?? "", release.version ?? "");
    const description = release.description || release.name || release.version;
    const content = createSearchContent([
      ...aliasTerms,
      release.repo,
      release.name,
      release.version,
      release.description,
      release.license,
      release.source,
    ]);

    return searchRecordLanguages.map((language) =>
      createSearchRecord({
        url: createSyntheticSearchRecordUrl("release", release.groupId, language),
        language,
        title,
        type: "asset",
        description,
        source: release.source,
        updatedAt: release.publishedAt,
        image: release.coverUrl,
        imageAlt: release.coverAlt,
        targetUrl: release.url,
        content,
      }),
    );
  });
}
