import type { ImageMetadata } from "astro";

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
