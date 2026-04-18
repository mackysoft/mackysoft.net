import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";

export const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const activityPath = path.join(repoRoot, "src/generated/activity.json");
export const activityCoverPublicBasePath = "/generated/activity-covers";
export const activityCoverPublicDir = path.join(repoRoot, "public", "generated", "activity-covers");
export const activityCoverSourceDir = path.join(repoRoot, "src", "generated", "activity-covers");
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

export async function fetchJson(url, { fetchImpl = fetch, init } = {}) {
  const response = await fetchImpl(url, init);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
