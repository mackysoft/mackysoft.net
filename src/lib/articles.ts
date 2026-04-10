import type { CollectionEntry } from "astro:content";

import activityData from "../generated/activity.json";
import type { ActivityData, ArticleItem } from "./article-items";
import { getLatestReleaseActivities, sortArticleItems, toExternalArticleItem } from "./article-items";

export type ArticleEntry = CollectionEntry<"articles">;
export type { ActivityData, ArticleActivity, ArticleItem, ReleaseActivity } from "./article-items";

const activity = activityData as ActivityData;

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
