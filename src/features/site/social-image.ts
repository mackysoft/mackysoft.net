import type { ImageMetadata } from "astro";

import { localizePath, type SiteLocale } from "../../lib/i18n";

const defaultSocialImageAltMap: Record<SiteLocale, string> = {
  ja: "mackysoft.net のカバー画像",
  en: "mackysoft.net cover image",
  "zh-hant": "mackysoft.net 封面圖片",
  ko: "mackysoft.net 커버 이미지",
};

const articleTitleSocialImageAltMap: Record<SiteLocale, (title: string) => string> = {
  ja: (title) => `${title} の記事タイトル画像`,
  en: (title) => `Title card for ${title}`,
  "zh-hant": (title) => `${title} 的文章標題圖片`,
  ko: (title) => `${title} 글 제목 이미지`,
};

export const defaultSocialImagePath = "/og/default.png";
export const defaultSocialImageWidth = 1200;
export const defaultSocialImageHeight = 630;
export const articleTitleCardImageWidth = 480;
export const articleTitleCardImageHeight = 252;

export type SocialImage = {
  src: string | ImageMetadata;
  alt: string;
  width: number;
  height: number;
};

export type LocalArticleImageInput = {
  slug: string;
  title: string;
  contentLocale: SiteLocale;
  cover?: ImageMetadata;
  coverAlt?: string;
};

export type ResolvedLocalArticlePageImages = {
  social: SocialImage;
  search: SocialImage;
};

export function getDefaultSocialImage(locale: SiteLocale) {
  return {
    src: defaultSocialImagePath,
    alt: defaultSocialImageAltMap[locale],
    width: defaultSocialImageWidth,
    height: defaultSocialImageHeight,
  } satisfies SocialImage;
}

export function getArticleTitleSocialImagePath(slug: string, locale: SiteLocale) {
  return localizePath(`/og/articles/${slug}.png`, locale);
}

export function getArticleTitleCardImagePath(slug: string, locale: SiteLocale) {
  return localizePath(`/og/articles/cards/${slug}.png`, locale);
}

export function getArticleTitleSocialImageAlt(title: string, locale: SiteLocale) {
  return articleTitleSocialImageAltMap[locale](title);
}

function createGeneratedLocalArticleImage({
  title,
  contentLocale,
  imagePath,
  width,
  height,
}: {
  title: string;
  contentLocale: SiteLocale;
  imagePath: string;
  width: number;
  height: number;
}) {
  return {
    src: imagePath,
    alt: getArticleTitleSocialImageAlt(title, contentLocale),
    width,
    height,
  } satisfies SocialImage;
}

function resolveLocalArticleImage({
  cover,
  coverAlt,
  generatedImage,
}: {
  cover?: ImageMetadata;
  coverAlt?: string;
  generatedImage: SocialImage;
}) {
  if (cover) {
    return {
      src: cover,
      alt: coverAlt ?? "",
      width: cover.width,
      height: cover.height,
    } satisfies SocialImage;
  }

  return generatedImage;
}

export function getGeneratedLocalArticleSocialImage({
  slug,
  title,
  contentLocale,
}: Pick<LocalArticleImageInput, "slug" | "title" | "contentLocale">) {
  return createGeneratedLocalArticleImage({
    title,
    contentLocale,
    imagePath: getArticleTitleSocialImagePath(slug, contentLocale),
    width: defaultSocialImageWidth,
    height: defaultSocialImageHeight,
  });
}

export function getGeneratedLocalArticleCardImage({
  slug,
  title,
  contentLocale,
}: Pick<LocalArticleImageInput, "slug" | "title" | "contentLocale">) {
  return createGeneratedLocalArticleImage({
    title,
    contentLocale,
    imagePath: getArticleTitleCardImagePath(slug, contentLocale),
    width: articleTitleCardImageWidth,
    height: articleTitleCardImageHeight,
  });
}

export function resolveLocalArticleSocialImage({
  slug,
  title,
  contentLocale,
  cover,
  coverAlt,
}: LocalArticleImageInput) {
  return resolveLocalArticleImage({
    cover,
    coverAlt,
    generatedImage: getGeneratedLocalArticleSocialImage({
      slug,
      title,
      contentLocale,
    }),
  });
}

export function resolveLocalArticleCardImage({
  slug,
  title,
  contentLocale,
  cover,
  coverAlt,
}: LocalArticleImageInput) {
  return resolveLocalArticleImage({
    cover,
    coverAlt,
    generatedImage: getGeneratedLocalArticleCardImage({
      slug,
      title,
      contentLocale,
    }),
  });
}

export function resolveLocalArticlePageImages(input: LocalArticleImageInput): ResolvedLocalArticlePageImages {
  return {
    social: resolveLocalArticleSocialImage(input),
    search: resolveLocalArticleCardImage(input),
  };
}
