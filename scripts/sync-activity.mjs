import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export const activityPath = path.join(repoRoot, "src/generated/activity.json");
export const zennFeedUrl = "https://zenn.dev/makihiro_dev/feed?all=1";
export const articleDescriptionMaxLength = 160;

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
 *   articles: ArticleActivity[];
 *   releases: unknown[];
 * }} ActivityData
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
 * @returns {ActivityData}
 */
export function createActivityData(articles) {
  return {
    articles,
    releases: [],
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

export async function syncActivity({ fetchImpl = fetch, outputPath = activityPath } = {}) {
  const xml = await fetchZennFeed(fetchImpl);
  const articles = parseZennFeed(xml);
  const activity = createActivityData(articles);
  await writeFile(outputPath, serializeActivity(activity), "utf8");
  return activity;
}

async function main() {
  const activity = await syncActivity();
  console.log(`Synced ${activity.articles.length} article(s) into ${path.relative(repoRoot, activityPath)}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
