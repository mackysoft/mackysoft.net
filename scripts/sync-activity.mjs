import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export const activityPath = path.join(repoRoot, "src/generated/activity.json");
export const zennFeedUrl = "https://zenn.dev/makihiro_dev/feed?all=1";
export const githubApiBaseUrl = "https://api.github.com";
export const githubGraphqlUrl = `${githubApiBaseUrl}/graphql`;
export const githubOwner = "mackysoft";
export const articleDescriptionMaxLength = 160;
export const githubReleasePageSize = 100;
export const githubReleaseRepoBlacklist = new Set([
  "mackysoft/Unity-GitHubActions-ExportPackage-Example",
  "mackysoft/Unity-GitHubActions-Build-Example",
]);

/**
 * @typedef {{
 *   title: string;
 *   description: string;
 *   url: string;
 *   coverUrl?: string;
 *   coverAlt?: string;
 * }} LocalizedArticleActivity
 */

/**
 * @typedef {{
 *   id: string;
 *   source: string;
 *   publishedAt: string;
 *   locales: {
 *     ja: LocalizedArticleActivity;
 *     en?: LocalizedArticleActivity;
 *   };
 * }} ArticleActivity
 */

/**
 * @typedef {{
 *   groupId: string;
 *   source: string;
 *   repo: string;
 *   description: string;
 *   license: string;
 *   stargazerCount: number;
 *   name: string;
 *   version: string;
 *   url: string;
 *   publishedAt: string;
 *   coverUrl: string;
 *   coverAlt: string;
 * }} ReleaseActivity
 */

/**
 * @typedef {{
 *   articles: ArticleActivity[];
 *   releases: ReleaseActivity[];
 * }} ActivityData
 */

/**
 * @typedef {{
 *   name: string;
 *   nameWithOwner: string;
 *   description: string | null;
 *   licenseInfo: {
 *     spdxId: string | null;
 *     name: string | null;
 *   } | null;
 *   isArchived: boolean;
 *   openGraphImageUrl: string;
 *   stargazerCount: number;
 * }} GitHubRepository
 */

/**
 * @typedef {{
 *   name: string | null;
 *   tag_name: string;
 *   html_url: string;
 *   published_at: string;
 *   draft: boolean;
 *   prerelease: boolean;
 * }} GitHubReleaseResponse
 */

export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function decodeHtmlEntities(value) {
  return cheerio.load(`<body>${value}</body>`).root().text();
}

export function summarizeDescription(value, maxLength = articleDescriptionMaxLength) {
  const normalized = normalizeWhitespace(decodeHtmlEntities(value));
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function createArticleId(url) {
  const { pathname } = new URL(url);
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments.at(-1);
  return slug ? `zenn:${slug}` : `zenn:${pathname}`;
}

export function createZennCoverAlt(title, locale = "ja") {
  return locale === "en" ? `${title} cover image` : `${title} のカバー画像`;
}

/**
 * @param {LocalizedArticleActivity} activity
 * @returns {LocalizedArticleActivity}
 */
export function createLocalizedArticleActivity(activity) {
  return {
    title: activity.title,
    description: activity.description,
    url: activity.url,
    ...(activity.coverUrl
      ? {
          coverUrl: activity.coverUrl,
          ...(activity.coverAlt ? { coverAlt: activity.coverAlt } : {}),
        }
      : {}),
  };
}

export function createReleaseGroupId(repo) {
  return `GitHub:${repo}`;
}

export function sortReleaseActivities(releases) {
  return releases.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function isStableGitHubRelease(release) {
  return !release.draft && !release.prerelease;
}

export function isBlacklistedGitHubReleaseRepository(repository) {
  return githubReleaseRepoBlacklist.has(repository.nameWithOwner);
}

export function isArchivedGitHubReleaseRepository(repository) {
  return repository.isArchived;
}

export function selectLatestStableRelease(releases) {
  const stableReleases = releases.filter((release) => isStableGitHubRelease(release) && normalizeWhitespace(release.published_at));
  return stableReleases.sort((left, right) => right.published_at.localeCompare(left.published_at))[0];
}

export function createGitHubHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "mackysoft.net-activity-sync",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchJson(url, { fetchImpl = fetch, init } = {}) {
  const response = await fetchImpl(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function normalizeGitHubRelease(repository, release) {
  const version = normalizeWhitespace(release.tag_name);
  const name = normalizeWhitespace(release.name || version);
  const publishedAt = normalizeWhitespace(release.published_at);
  const description = normalizeWhitespace(repository.description ?? "");
  const license = normalizeWhitespace(
    repository.licenseInfo?.spdxId && repository.licenseInfo.spdxId !== "NOASSERTION"
      ? repository.licenseInfo.spdxId
      : repository.licenseInfo?.name ?? "",
  );

  if (
    !version
    || !name
    || !release.html_url
    || !publishedAt
    || !repository.openGraphImageUrl
    || !Number.isInteger(repository.stargazerCount)
    || repository.stargazerCount < 0
  ) {
    throw new Error(`GitHub release for ${repository.nameWithOwner} is missing required fields.`);
  }

  return {
    groupId: createReleaseGroupId(repository.nameWithOwner),
    source: "GitHub",
    repo: repository.nameWithOwner,
    description,
    license,
    stargazerCount: repository.stargazerCount,
    name,
    version,
    url: release.html_url,
    publishedAt,
    coverUrl: repository.openGraphImageUrl,
    coverAlt: `${repository.nameWithOwner} のリポジトリサムネイル`,
  };
}

export function extractNextData(html) {
  const $ = cheerio.load(html);
  const nextData = $("script#__NEXT_DATA__").html();

  if (nextData) {
    return JSON.parse(nextData);
  }

  const matched = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

  if (matched?.[1]) {
    return JSON.parse(matched[1]);
  }

  throw new Error("Zenn article page is missing __NEXT_DATA__.");
}

/**
 * @typedef {{
 *   locale: string;
 *   isTranslated: boolean;
 * } & LocalizedArticleActivity} ParsedZennArticlePage
 */

/**
 * @param {string} html
 * @returns {ParsedZennArticlePage}
 */
export function parseZennArticlePage(html) {
  const $ = cheerio.load(html);
  const nextData = extractNextData(html);
  const article = nextData?.props?.pageProps?.article;
  const locale = normalizeWhitespace(nextData?.props?.pageProps?.locale ?? article?.locale ?? "");
  const title = normalizeWhitespace(article?.title ?? $("title").text());
  const description = summarizeDescription(article?.bodyHtml ? cheerio.load(article.bodyHtml).root().text() : "");
  const url = normalizeWhitespace(
    $("link[rel='canonical']").attr("href")
    ?? $("meta[property='og:url']").attr("content")
    ?? "",
  );
  const coverUrl = normalizeWhitespace(article?.ogImageUrl ?? $("meta[property='og:image']").attr("content") ?? "");

  if (!title || !description || !url || !locale) {
    throw new Error("Zenn article page is missing required localized article fields.");
  }

  return {
    title,
    description,
    url,
    locale,
    isTranslated: Boolean(article?.isTranslated),
    ...(coverUrl
      ? {
          coverUrl,
          coverAlt: createZennCoverAlt(title, locale === "en" ? "en" : "ja"),
        }
      : {}),
  };
}

/**
 * @param {string} xml
 * @returns {ArticleActivity[]}
 */
export function parseZennFeed(xml) {
  const $ = cheerio.load(xml, {
    xmlMode: true,
  });

  return $("item")
    .toArray()
    .map((element) => {
      const item = $(element);
      const title = normalizeWhitespace(decodeHtmlEntities(item.find("title").first().text()));
      const description = summarizeDescription(item.find("description").first().text());
      const url = normalizeWhitespace(item.find("link").first().text());
      const publishedAtText = normalizeWhitespace(item.find("pubDate").first().text());
      const publishedAt = new Date(publishedAtText);
      const coverUrl = normalizeWhitespace(item.find("enclosure").attr("url") ?? "");

      if (!title || !description || !url || Number.isNaN(publishedAt.valueOf())) {
        throw new Error("Zenn RSS item is missing required article fields.");
      }

      return {
        id: createArticleId(url),
        source: "Zenn",
        publishedAt: publishedAt.toISOString(),
        locales: {
          ja: createLocalizedArticleActivity({
            title,
            description,
            url,
            ...(coverUrl
              ? {
                  coverUrl,
                  coverAlt: createZennCoverAlt(title, "ja"),
                }
              : {}),
          }),
        },
      };
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

/**
 * @param {ArticleActivity[]} articles
 * @param {ReleaseActivity[]} releases
 * @returns {ActivityData}
 */
export function createActivityData(articles, releases) {
  return {
    articles,
    releases,
  };
}

/**
 * @param {ActivityData} activity
 */
export function serializeActivity(activity) {
  return `${JSON.stringify(activity, null, 2)}\n`;
}

export async function fetchZennFeed(fetchImpl = fetch) {
  const response = await fetchImpl(zennFeedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Zenn feed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export async function fetchZennArticleHtml(url, locale = "en", fetchImpl = fetch) {
  const localizedUrl = new URL(url);
  localizedUrl.searchParams.set("locale", locale);

  const response = await fetchImpl(localizedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch Zenn article ${localizedUrl}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * @param {ArticleActivity} article
 * @param {(input: string | URL | Request, init?: RequestInit) => Promise<Response>} [fetchImpl]
 * @returns {Promise<ArticleActivity>}
 */
export async function enrichZennArticleWithEnglishLocale(article, fetchImpl = fetch) {
  try {
    const html = await fetchZennArticleHtml(article.locales.ja.url, "en", fetchImpl);
    const localizedArticle = parseZennArticlePage(html);

    if (!localizedArticle.isTranslated || localizedArticle.locale !== "en") {
      return article;
    }

    return {
      ...article,
      locales: {
        ...article.locales,
        en: createLocalizedArticleActivity({
          title: localizedArticle.title,
          description: localizedArticle.description,
          url: localizedArticle.url,
          ...(localizedArticle.coverUrl
            ? {
                coverUrl: localizedArticle.coverUrl,
                coverAlt: localizedArticle.coverAlt,
              }
            : {}),
        }),
      },
    };
  } catch (error) {
    console.warn(`Skipping English locale for ${article.id}: ${error instanceof Error ? error.message : String(error)}`);
    return article;
  }
}

export async function enrichZennArticlesWithEnglishLocale(articles, fetchImpl = fetch) {
  return Promise.all(articles.map((article) => enrichZennArticleWithEnglishLocale(article, fetchImpl)));
}

export async function fetchGitHubRepositories(fetchImpl = fetch) {
  const repositories = [];
  const headers = createGitHubHeaders();
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const payload = await fetchJson(githubGraphqlUrl, {
      fetchImpl,
      init: {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: `
            query GitHubRepositories($login: String!, $first: Int!, $after: String) {
              user(login: $login) {
                repositories(
                  first: $first
                  after: $after
                  privacy: PUBLIC
                  ownerAffiliations: OWNER
                  orderBy: { field: UPDATED_AT, direction: DESC }
                ) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  nodes {
                    name
                    nameWithOwner
                    description
                    licenseInfo {
                      spdxId
                      name
                    }
                    isArchived
                    openGraphImageUrl
                    stargazerCount
                  }
                }
              }
            }
          `,
          variables: {
            login: githubOwner,
            first: 100,
            after: cursor,
          },
        }),
      },
    });

    if (payload.errors?.length) {
      throw new Error(`Failed to fetch GitHub repositories: ${payload.errors[0].message}`);
    }

    const connection = payload.data?.user?.repositories;
    if (!connection) {
      throw new Error(`Failed to fetch GitHub repositories for owner ${githubOwner}.`);
    }

    repositories.push(
      ...connection.nodes.filter(
        (node) => node?.nameWithOwner && node?.openGraphImageUrl && Number.isInteger(node?.stargazerCount),
      ),
    );
    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return repositories;
}

export async function fetchGitHubReleasesForRepository(nameWithOwner, page = 1, fetchImpl = fetch) {
  const headers = createGitHubHeaders();
  const url = `${githubApiBaseUrl}/repos/${nameWithOwner}/releases?per_page=${githubReleasePageSize}&page=${page}`;
  return fetchJson(url, {
    fetchImpl,
    init: {
      headers,
    },
  });
}

export async function fetchAllGitHubReleasesForRepository(nameWithOwner, fetchImpl = fetch) {
  const releases = [];
  let page = 1;

  while (true) {
    const pageReleases = await fetchGitHubReleasesForRepository(nameWithOwner, page, fetchImpl);
    releases.push(...pageReleases);

    if (pageReleases.length < githubReleasePageSize) {
      return releases;
    }

    page += 1;
  }
}

export async function fetchGitHubReleaseActivities(fetchImpl = fetch) {
  const repositories = await fetchGitHubRepositories(fetchImpl);
  const releases = [];

  for (const repository of repositories) {
    if (isBlacklistedGitHubReleaseRepository(repository) || isArchivedGitHubReleaseRepository(repository)) {
      continue;
    }

    const repositoryReleases = await fetchAllGitHubReleasesForRepository(repository.nameWithOwner, fetchImpl);
    const stableRelease = selectLatestStableRelease(repositoryReleases);

    if (!stableRelease) {
      continue;
    }

    releases.push(normalizeGitHubRelease(repository, stableRelease));
  }

  return sortReleaseActivities(releases);
}

export async function syncActivity({ fetchImpl = fetch, outputPath = activityPath } = {}) {
  const xml = await fetchZennFeed(fetchImpl);
  const articles = await enrichZennArticlesWithEnglishLocale(parseZennFeed(xml), fetchImpl);
  const releases = await fetchGitHubReleaseActivities(fetchImpl);
  const activity = createActivityData(articles, releases);
  await writeFile(outputPath, serializeActivity(activity), "utf8");
  return activity;
}

async function main() {
  const activity = await syncActivity();
  console.log(
    `Synced ${activity.articles.length} article(s) and ${activity.releases.length} release(s) into ${path.relative(repoRoot, activityPath)}.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
