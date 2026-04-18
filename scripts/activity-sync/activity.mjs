import { writeFile } from "node:fs/promises";

import { syncReleaseCoverAssets, syncReleaseCoverSourceAssets } from "./covers.mjs";
import { fetchGitHubReleaseActivities } from "./github.mjs";
import { activityCoverPublicDir, activityCoverSourceDir, activityPath } from "./shared.mjs";
import { enrichZennArticlesWithEnglishLocale, fetchZennFeed, parseZennFeed } from "./zenn.mjs";

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

/**
 * @param {{ fetchImpl?: typeof fetch; outputPath?: string; coverOutputDir?: string }} [options]
 * @returns {Promise<ActivityData>}
 */
export async function syncActivity({
  fetchImpl = fetch,
  outputPath = activityPath,
  coverOutputDir = activityCoverPublicDir,
  coverSourceDir = activityCoverSourceDir,
} = {}) {
  const xml = await fetchZennFeed(fetchImpl);
  const articles = await enrichZennArticlesWithEnglishLocale(parseZennFeed(xml), fetchImpl);
  const releases = await syncReleaseCoverAssets(await fetchGitHubReleaseActivities(fetchImpl), {
    fetchImpl,
    activityPath: outputPath,
    coverOutputDir,
  });
  const activity = createActivityData(articles, releases);
  await writeFile(outputPath, serializeActivity(activity), "utf8");
  await syncReleaseCoverSourceAssets(releases, {
    sourceCoverDir: coverOutputDir,
    outputDir: coverSourceDir,
  });
  return activity;
}
