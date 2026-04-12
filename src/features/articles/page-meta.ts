import type { SiteLocale } from "../../lib/i18n";

type ArticleListLabels = {
  articles: string;
  archive: string;
  tag: string;
};

const articlesIndexDescriptionMap: Record<SiteLocale, string> = {
  ja: "自サイトと Zenn に公開した記事一覧です。",
  en: "Articles published on this site and Zenn.",
};

export function getArticlesIndexPageMeta(locale: SiteLocale, labels: Pick<ArticleListLabels, "articles">) {
  return {
    title: labels.articles,
    description: articlesIndexDescriptionMap[locale],
  };
}

export function getArticlesArchiveYearPageMeta(locale: SiteLocale, year: string, labels: Pick<ArticleListLabels, "archive">) {
  return {
    title: `${labels.archive} ${year}`,
    description: locale === "en" ? `Articles published in ${year}.` : `${year} 年の記事一覧です。`,
  };
}

export function getArticlesArchiveMonthPageMeta(
  locale: SiteLocale,
  year: string,
  month: string,
  labels: Pick<ArticleListLabels, "archive">,
) {
  return {
    title: `${labels.archive} ${year}/${month}`,
    description: locale === "en" ? `Articles published in ${year}/${month}.` : `${year} 年 ${month} 月の記事一覧です。`,
  };
}

export function getArticlesTagPageMeta(locale: SiteLocale, tag: string, labels: Pick<ArticleListLabels, "tag">) {
  return {
    title: `${labels.tag}: ${tag}`,
    description: locale === "en" ? `Articles tagged with ${tag}.` : `${tag} に紐づく記事一覧です。`,
  };
}
