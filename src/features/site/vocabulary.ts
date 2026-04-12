import type { SiteLocale } from "../../lib/i18n";

export type SiteVocabulary = {
  home: string;
  about: string;
  games: string;
  assets: string;
  articles: string;
  search: string;
  contact: string;
  privacyPolicy: string;
  tag: string;
  archive: string;
};

export const siteVocabularyMap: Record<SiteLocale, SiteVocabulary> = {
  ja: {
    home: "Home",
    about: "About",
    games: "Games",
    assets: "Assets",
    articles: "Articles",
    search: "Search",
    contact: "Contact",
    privacyPolicy: "Privacy Policy",
    tag: "Tag",
    archive: "Archive",
  },
  en: {
    home: "Home",
    about: "About",
    games: "Games",
    assets: "Assets",
    articles: "Articles",
    search: "Search",
    contact: "Contact",
    privacyPolicy: "Privacy Policy",
    tag: "Tag",
    archive: "Archive",
  },
};

export function getSiteVocabulary(locale: SiteLocale) {
  return siteVocabularyMap[locale];
}
