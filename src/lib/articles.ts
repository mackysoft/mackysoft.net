import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";

import activityData from "../generated/activity.json";

export type ArticleEntry = CollectionEntry<"articles">;

export type ArticleActivity = {
  id: string;
  source: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  coverUrl?: string;
  coverAlt?: string;
};

export type ReleaseActivity = {
  groupId: string;
  source: string;
  repo: string;
  stargazerCount: number;
  name: string;
  version: string;
  url: string;
  publishedAt: string;
  coverUrl: string;
  coverAlt: string;
};

export type ActivityData = {
  articles: ArticleActivity[];
  releases: ReleaseActivity[];
};

export type ArticleItem = {
  id: string;
  kind: "local" | "external";
  title: string;
  description: string;
  href: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  source: string;
  cover?: ImageMetadata | string;
  coverAlt?: string;
};

const activity = activityData as ActivityData;

export function sortArticleItems(articleItems: ArticleItem[]) {
  return articleItems.sort((left, right) => right.publishedAt.valueOf() - left.publishedAt.valueOf());
}

export function sortReleaseActivities(releases: ReleaseActivity[]) {
  return releases.sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export function getLatestReleaseActivities(releases: ReleaseActivity[], limit = 3) {
  return sortReleaseActivities([...releases]).slice(0, limit);
}

export function toExternalArticleItem(article: ArticleActivity): ArticleItem {
  return {
    id: article.id,
    kind: "external",
    title: article.title,
    description: article.description,
    href: article.url,
    publishedAt: new Date(article.publishedAt),
    tags: [],
    source: article.source,
    cover: article.coverUrl,
    coverAlt: article.coverAlt,
  };
}

export async function getLocalArticles() {
  const { getCollection } = await import("astro:content");
  const articles = await getCollection("articles", ({ data }) => !data.draft);
  return articles.sort((left, right) => right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf());
}

export async function getArticleItems() {
  const localArticles = (await getLocalArticles()).map(toLocalArticleItem);
  const externalArticles = activity.articles.map(toExternalArticleItem);
  return sortArticleItems([...localArticles, ...externalArticles]);
}

export function getLatestReleases(limit = 3) {
  return getLatestReleaseActivities(activity.releases, limit);
}

export function toLocalArticleItem(article: ArticleEntry): ArticleItem {
  return {
    id: article.id,
    kind: "local",
    title: article.data.title,
    description: article.data.description,
    href: `/articles/${article.id}/`,
    publishedAt: article.data.publishedAt,
    updatedAt: article.data.updatedAt,
    tags: article.data.tags,
    source: "mackysoft.net",
    cover: article.data.cover,
    coverAlt: article.data.coverAlt,
  };
}
