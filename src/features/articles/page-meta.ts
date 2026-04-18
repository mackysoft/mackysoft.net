import type { SiteLocale } from "../../lib/i18n";

type ArticleListLabels = {
  articles: string;
  archive: string;
  tag: string;
};

const articlesIndexDescriptionMap: Record<SiteLocale, string> = {
  ja: "自サイトと Zenn に公開した記事一覧です。",
  en: "Articles published on this site and Zenn.",
  "zh-hant": "本站與 Zenn 上公開的文章列表。",
  ko: "이 사이트와 Zenn에 공개한 글 목록입니다.",
};

const articlesArchiveYearDescriptionMap: Record<SiteLocale, (year: string) => string> = {
  ja: (year) => `${year} 年の記事一覧です。`,
  en: (year) => `Articles published in ${year}.`,
  "zh-hant": (year) => `${year} 年的文章列表。`,
  ko: (year) => `${year}년에 공개한 글 목록입니다.`,
};

const articlesArchiveMonthDescriptionMap: Record<SiteLocale, (year: string, month: string) => string> = {
  ja: (year, month) => `${year} 年 ${month} 月の記事一覧です。`,
  en: (year, month) => `Articles published in ${year}/${month}.`,
  "zh-hant": (year, month) => `${year}/${month} 的文章列表。`,
  ko: (year, month) => `${year}/${month}에 공개한 글 목록입니다.`,
};

const articlesTagDescriptionMap: Record<SiteLocale, (tagLabel: string) => string> = {
  ja: (tagLabel) => `${tagLabel} に紐づく記事一覧です。`,
  en: (tagLabel) => `Articles tagged with ${tagLabel}.`,
  "zh-hant": (tagLabel) => `標記為 ${tagLabel} 的文章列表。`,
  ko: (tagLabel) => `${tagLabel} 태그가 붙은 글 목록입니다.`,
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
    description: articlesArchiveYearDescriptionMap[locale](year),
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
    description: articlesArchiveMonthDescriptionMap[locale](year, month),
  };
}

export function getArticlesTagPageMeta(locale: SiteLocale, tagLabel: string, labels: Pick<ArticleListLabels, "tag">) {
  return {
    title: `${labels.tag}: ${tagLabel}`,
    description: articlesTagDescriptionMap[locale](tagLabel),
  };
}
