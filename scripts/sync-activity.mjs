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

/**
 * @typedef {{
 *   id: string;
 *   source: string;
 *   title: string;
 *   description: string;
 *   url: string;
 *   publishedAt: string;
 *   coverUrl?: string;
 *   coverAlt?: string;
 * }} ArticleActivity
 */

/**
 * @typedef {{
 *   groupId: string;
 *   source: string;
 *   repo: string;
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
 *   openGraphImageUrl: string;
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

export function createReleaseGroupId(repo) {
  return `GitHub:${repo}`;
}

export function sortReleaseActivities(releases) {
  return releases.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function isStableGitHubRelease(release) {
  return !release.draft && !release.prerelease;
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

  if (!version || !name || !release.html_url || !publishedAt || !repository.openGraphImageUrl) {
    throw new Error(`GitHub release for ${repository.nameWithOwner} is missing required fields.`);
  }

  return {
    groupId: createReleaseGroupId(repository.nameWithOwner),
    source: "GitHub",
    repo: repository.nameWithOwner,
    name,
    version,
    url: release.html_url,
    publishedAt,
    coverUrl: repository.openGraphImageUrl,
    coverAlt: `${repository.nameWithOwner} のリポジトリサムネイル`,
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
        title,
        description,
        url,
        publishedAt: publishedAt.toISOString(),
        ...(coverUrl
          ? {
              coverUrl,
              coverAlt: `${title} のカバー画像`,
            }
          : {}),
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
                    openGraphImageUrl
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

    repositories.push(...connection.nodes.filter((node) => node?.nameWithOwner && node?.openGraphImageUrl));
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
  const articles = parseZennFeed(xml);
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
