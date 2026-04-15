import path from "node:path";
import { fileURLToPath } from "node:url";

import { syncActivity } from "./activity-sync/activity.mjs";
import { activityPath, repoRoot } from "./activity-sync/shared.mjs";

export {
  createActivityData,
  serializeActivity,
  syncActivity,
} from "./activity-sync/activity.mjs";
export {
  createReleaseGroupId,
  createGitHubHeaders,
  fetchAllGitHubReleasesForRepository,
  fetchGitHubReleaseActivities,
  fetchGitHubReleasesForRepository,
  fetchGitHubRepositories,
  isArchivedGitHubReleaseRepository,
  isBlacklistedGitHubReleaseRepository,
  isStableGitHubRelease,
  normalizeGitHubRelease,
  selectLatestStableRelease,
  sortReleaseActivities,
} from "./activity-sync/github.mjs";
export {
  activityPath,
  articleDescriptionMaxLength,
  fetchJson,
  githubApiBaseUrl,
  githubGraphqlUrl,
  githubOwner,
  githubReleasePageSize,
  githubReleaseRepoBlacklist,
  normalizeWhitespace,
  decodeHtmlEntities,
  repoRoot,
  summarizeDescription,
  zennFeedUrl,
} from "./activity-sync/shared.mjs";
export {
  createArticleId,
  createLocalizedArticleActivity,
  createZennCoverAlt,
  enrichZennArticleWithEnglishLocale,
  enrichZennArticlesWithEnglishLocale,
  extractNextData,
  fetchZennArticleHtml,
  fetchZennFeed,
  parseZennArticlePage,
  parseZennFeed,
} from "./activity-sync/zenn.mjs";

async function main() {
  const activity = await syncActivity();
  console.log(
    `Synced ${activity.articles.length} article(s) and ${activity.releases.length} release(s) into ${path.relative(repoRoot, activityPath)}.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
