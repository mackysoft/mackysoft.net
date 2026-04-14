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

export function getDefaultSocialImage(locale: SiteLocale) {
  return {
    src: defaultSocialImagePath,
    alt: defaultSocialImageAltMap[locale],
    width: defaultSocialImageWidth,
    height: defaultSocialImageHeight,
  };
}

export function getArticleTitleSocialImagePath(slug: string, locale: SiteLocale) {
  return localizePath(`/og/articles/${slug}.png`, locale);
}

export function getArticleTitleSocialImageAlt(title: string, locale: SiteLocale) {
  return articleTitleSocialImageAltMap[locale](title);
}

export function getLocalArticleSocialImage({
  slug,
  title,
  requestedLocale: _requestedLocale,
  contentLocale,
  hasCustomCover,
}: {
  slug: string;
  title: string;
  requestedLocale?: SiteLocale;
  contentLocale: SiteLocale;
  hasCustomCover: boolean;
}) {
  if (hasCustomCover) {
    return null;
  }

  return {
    src: getArticleTitleSocialImagePath(slug, contentLocale),
    alt: getArticleTitleSocialImageAlt(title, contentLocale),
    width: defaultSocialImageWidth,
    height: defaultSocialImageHeight,
  };
}
