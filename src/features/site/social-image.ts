import type { ImageMetadata } from "astro";

import { localizePath, type SiteLocale } from "../../lib/i18n";

const defaultSocialImageAltMap: Record<SiteLocale, string> = {
  ja: "mackysoft.net のカバー画像",
  en: "mackysoft.net cover image",
};

const articleTitleSocialImageAltMap: Record<SiteLocale, (title: string) => string> = {
  ja: (title) => `${title} の記事タイトル画像`,
  en: (title) => `Title card for ${title}`,
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
}: {
  slug: string;
  title: string;
  contentLocale: SiteLocale;
}) {
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
}: {
  slug: string;
  title: string;
  contentLocale: SiteLocale;
}) {
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
}: {
  slug: string;
  title: string;
  contentLocale: SiteLocale;
  cover?: ImageMetadata;
  coverAlt?: string;
}) {
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
}: {
  slug: string;
  title: string;
  contentLocale: SiteLocale;
  cover?: ImageMetadata;
  coverAlt?: string;
}) {
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
