import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import type { ImageMetadata } from "astro";

import externalArticles from "../generated/external-articles";

export type ArticleEntry = CollectionEntry<"articles">;

export type WritingItem = {
  id: string;
  kind: "local" | "external";
  title: string;
  description: string;
  href: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  source: string;
  cover?: ImageMetadata;
  coverAlt?: string;
};

export async function getLocalArticles() {
  const articles = await getCollection("articles", ({ data }) => !data.draft);
  return articles.sort((left, right) => right.data.publishedAt.valueOf() - left.data.publishedAt.valueOf());
}

export async function getWritingItems() {
  const localArticles = (await getLocalArticles()).map(toLocalWritingItem);
  const syndicatedArticles = externalArticles.map((article) => ({
    id: article.id,
    kind: "external" as const,
    title: article.title,
    description: article.description,
    href: article.url,
    publishedAt: new Date(article.publishedAt),
    tags: article.tags ?? [],
    source: article.source,
  }));

  return [...localArticles, ...syndicatedArticles].sort(
    (left, right) => right.publishedAt.valueOf() - left.publishedAt.valueOf(),
  );
}

export function toLocalWritingItem(article: ArticleEntry): WritingItem {
  return {
    id: article.id,
    kind: "local",
    title: article.data.title,
    description: article.data.description,
    href: `/articles/${article.id}/`,
    publishedAt: article.data.publishedAt,
    updatedAt: article.data.updatedAt,
    tags: article.data.tags,
    source: "Local",
    cover: article.data.cover,
    coverAlt: article.data.coverAlt,
  };
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
