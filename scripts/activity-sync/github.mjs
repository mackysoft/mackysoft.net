import {
  fetchJson,
  githubApiBaseUrl,
  githubGraphqlUrl,
  githubOwner,
  githubReleasePageSize,
  githubReleaseRepoBlacklist,
  normalizeWhitespace,
} from "./shared.mjs";

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
