import type { SiteLocale } from "../../lib/i18n";

const defaultSocialImageAltMap: Record<SiteLocale, string> = {
  ja: "mackysoft.net のカバー画像",
  en: "mackysoft.net cover image",
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
