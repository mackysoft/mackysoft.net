import type { RSSFeedItem } from "@astrojs/rss";

import type { ArticleEntry } from "../articles";
import { getLocalArticles } from "../articles";

export type FeedArticleCandidate = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  draft: boolean;
  kind: "local" | "external";
  path?: string;
};

export type PublicLocalArticle = Omit<FeedArticleCandidate, "draft" | "kind"> & {
  path: string;
};

export function toFeedArticleCandidate(article: Pick<ArticleEntry, "id" | "data">): FeedArticleCandidate {
  return {
    slug: article.id,
    title: article.data.title,
    description: article.data.description,
    publishedAt: article.data.publishedAt,
    updatedAt: article.data.updatedAt,
    tags: article.data.tags,
    draft: article.data.draft,
    kind: "local",
    path: `/articles/${article.id}/`,
  };
}

export function selectPublicLocalArticles(candidates: readonly FeedArticleCandidate[]): PublicLocalArticle[] {
  return candidates
    .filter((candidate) => candidate.kind === "local" && !candidate.draft)
    .map(({ draft: _draft, kind: _kind, path, ...candidate }) => ({
      ...candidate,
      path: path ?? `/articles/${candidate.slug}/`,
    }));
}

export async function getPublicLocalArticles() {
  return selectPublicLocalArticles((await getLocalArticles()).map(toFeedArticleCandidate));
}

export function getFeedLastBuildDate(articles: readonly Pick<PublicLocalArticle, "publishedAt" | "updatedAt">[]) {
  if (articles.length === 0) {
    return null;
  }

  return articles.reduce<Date>(
    (latestDate, article) => {
      const candidateDate = article.updatedAt ?? article.publishedAt;
      return candidateDate.valueOf() > latestDate.valueOf() ? candidateDate : latestDate;
    },
    articles[0]?.updatedAt ?? articles[0]!.publishedAt,
  );
}

export function toRssFeedItems(articles: readonly PublicLocalArticle[]): RSSFeedItem[] {
  return articles.map((article) => ({
    title: article.title,
    description: article.description,
    link: article.path,
    pubDate: article.publishedAt,
    categories: article.tags,
  }));
}
