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

export function getArticleTitleSocialImageAlt(title: string, locale: SiteLocale) {
  return articleTitleSocialImageAltMap[locale](title);
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
  return {
    src: getArticleTitleSocialImagePath(slug, contentLocale),
    alt: getArticleTitleSocialImageAlt(title, contentLocale),
    width: defaultSocialImageWidth,
    height: defaultSocialImageHeight,
  } satisfies SocialImage;
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
  if (cover) {
    return {
      src: cover,
      alt: coverAlt ?? "",
      width: cover.width,
      height: cover.height,
    } satisfies SocialImage;
  }

  return getGeneratedLocalArticleSocialImage({
    slug,
    title,
    contentLocale,
  });
}
